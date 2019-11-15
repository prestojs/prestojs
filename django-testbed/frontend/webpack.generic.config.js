'use strict';
const _ = require('lodash');

const { argv } = require('yargs');
const { execSync } = require('child_process');

/**
 * Generate version string to use for purposes of notifying users when a new build
 * has been deployed (eg. they need to refresh their browser) or the current release of the
 * codebase for logging
 *
 * This is generated at build time and stored in 2 places:
 *
 * - version.json in the build dir. This can be used to determine the latest deployed version.
 * - A __VERSION__ constant that can be used in JS that is resolved by webpack at build time.
 *   This can be used to determine the currently loaded version.
 * @returns {string}
 */
function getVersion() {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
}

function getClientEnvironment(publicUrl) {
    const node_env = process.env.NODE_ENV || 'development';
    const processEnv = {
        // Useful for determining whether we’re running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: JSON.stringify(node_env),
        // Useful for resolving the correct path to static assets in `public`.
        // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
        // This should only be used as an escape hatch. Normally you would put
        // images into the `src` and `import` them in code to get their paths.
        PUBLIC_URL: JSON.stringify(publicUrl),
    };
    return {
        'process.env': processEnv,
        // Used in React setup to include/exclude devtools
        __DEBUG__: node_env === 'development' && !argv.no_debug,
        // Used in React setup to open devtools in new window
        __DEBUG_NEW_WINDOW__: !!argv.nw,
        __VERSION__: JSON.stringify(getVersion()),
    };
}

/**
 * Get the path to a given module
 *
 * This is different to require.resolve() which returns the JS entrypoint file; this instead
 * returns the root dir for the module
 *
 * @param moduleName
 * @returns string or undefined
 */
function getNodeModulePath(moduleName) {
    const fs = require('fs');
    const path = require('path');

    const searchPaths = require.resolve.paths(moduleName);
    for (let searchPath of searchPaths) {
        const candidate = path.join(searchPath, moduleName);
        try {
            if (fs.lstatSync(candidate).isDirectory()) return candidate + path.sep;
        } catch (ex) {
            // permission error
        }
    }
    return undefined;
}

module.exports = ({
    // one of 'development' or 'production'
    environment,

    // undefined (use default), true (more verbose default), or webpack 'devtool' setting
    sourceMap = undefined,

    // Include settings for bootstrap-sass?
    bootstrap = false,
    // Add bootstrap to the sass includePath?
    // allows you to do cleaner imports, eg
    //      @import 'bootstrap/buttons';
    // Not done by default because it breaks IDE discoverability
    bootstrapSassIncludePath = false,

    // Target browsers
    //  affects css generation, babel code generation & polyfills
    // https://github.com/ai/browserslist
    browsers = [
        '>1%',
        'last 4 versions',
        'Firefox ESR',
        'not ie < 9', // React doesn't support IE8 anyway
    ],

    // Include settings for react?
    react = false,

    // Include settings for jQuery?
    jQuery = false,

    // Enable hot reloading?
    // (Only for dev obviously)
    hotReload = false,

    // Use ant design?
    antd = false,

    // Use css-modules?
    cssModules = react,
    sass = bootstrap,
    less = antd,

    // Include source maps for CSS
    cssSourceMaps = true,

    // Dev server config
    serverHost = '0.0.0.0',
    serverPort = '3000',

    // List of webpack bundles
    //
    // bundle name => [ list of files ]
    //
    // use require() syntax, eg
    //  './src/index.js' for local source
    //  'jquery' for npm package
    entryPoints,

    vendorPackages = [],

    // Show bundle stats?
    analyze = false,

    // insert content hash into bundle filenames? (prod only)
    // Not usually needed - included as query parameter by render_entry_point django tag
    chunkHash = false,

    // root PUBLIC_PATH for production (ie the url that django static assets are collected to)
    publicPathRoot = '/assets/',

    includeSentry = false,
} = {}) => {
    // NOTE: these are static imports but some imports later on are optional, so we use require() for consistency
    const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
    const EntryPointBundleTracker = require('@alliance-software/webpack-dev-utils/plugins/EntryPointBundleTracker');
    const LessModifyPreprocessorPlugin = require('@alliance-software/webpack-dev-utils/plugins/LessModifySourcePreprocessorPlugin');
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    const eslintFormatter = require('@alliance-software/webpack-dev-utils/eslintFormatter');
    const TerserPlugin = require('terser-webpack-plugin');
    const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
    const WriteJsonFilePlugin = require('./plugins/WriteJsonFilePlugin');
    const SentryWebpackPlugin = require('@sentry/webpack-plugin');

    const assert = require('assert');
    const autoprefixer = require('autoprefixer');
    const path = require('path');
    const webpack = require('webpack');

    const sentryConfigFile = path.join(__dirname, 'sentry.properties');

    if (includeSentry) {
        try {
            execSync(
                `SENTRY_PROPERTIES=${sentryConfigFile} ${path.resolve(
                    '../node_modules/.bin/sentry-cli'
                )} releases list`
            );
            console.info('✅ Sentry setup verified');
        } catch (e) {
            throw new Error(`This build needs to generate artifacts for sentry but it doesn't look like you have sentry CLI setup. To get going follow these steps:

1. Ensure you have an auth token for the appropriate Sentry account and that it's saved in .sentryclirc in the project root
2. Ensure that the organisation and project are set in sentry.properties in the project root as described in the project README
2. Try again!


`);
        }
    }

    // TODO: relative paths in stats file
    // TODO: chunk-manifest-webpack-plugin
    // TODO: webpack-dashboard
    // TODO: vue
    // TODO: pngcrush for production
    // TODO: vanilla CSS handling
    // TODO: handle JS located in django apps
    // TODO: handle (S)CSS located in django apps
    // TODO: tree shaking
    //      babel-plugin-lodash
    //      lodash-webpack-plugin https://github.com/lodash/lodash-webpack-plugin#feature-sets

    // TODO: use webpack-node-externals?

    const isDev = environment != 'production';
    const FRONTEND_DIR = './';
    const NODE_MODULES_PATHS = [path.resolve('../../node_modules')];

    const OUTPUT_DIR_BASE = path.join(FRONTEND_DIR) + '/';
    const OUTPUT_DIR_RELATIVE = isDev ? 'dev/' : 'dist/';
    // In dev assets are served from dev server, otherwise filesystem
    const PUBLIC_PATH = isDev
        ? `http://${serverHost}:${serverPort}/`
        : publicPathRoot + OUTPUT_DIR_RELATIVE;
    const INLINE_BINARY_DATA_LIMIT = 8192;

    assert(
        ['development', 'production'].indexOf(environment) >= 0,
        '"environment" option is not valid'
    );

    if (react && (sourceMap === undefined || sourceMap === true)) {
        sourceMap = isDev ? 'cheap-module-source-map' : 'source-map';
    }

    if (sourceMap === true) sourceMap = isDev ? 'eval-source-map' : 'source-map';
    if (sourceMap === undefined) sourceMap = isDev ? 'eval-source-map' : false;

    if (react && isDev) {
        assert(
            sourceMap === 'cheap-module-source-map',
            "React projects should use set sourceMap to 'cheap-module-source-map' in dev. See https://reactjs.org/docs/cross-origin-errors.html"
        );
    }

    if (isDev && hotReload) {
        const makeHot = entry => {
            // HMR related loaders must come first
            entry.unshift('webpack/hot/dev-server');
            if (react) {
                entry.unshift(
                    require.resolve('@alliance-software/webpack-dev-utils/client/hot-client-errors')
                );
            }
        };
        _.forIn(entryPoints, entryPoint => {
            makeHot(entryPoint);
        });
    }

    // ----------------------------------------------------------------------
    // Base config
    const outputFilenamePattern =
        isDev || !chunkHash ? '[name].bundle' : '[name].[chunkhash].bundle';
    let conf = {
        // In production don't continue if there's errors
        bail: !isDev,
        mode: isDev ? 'development' : 'production',
        devtool: sourceMap,
        entry: entryPoints,
        output: {
            path: path.join(__dirname, OUTPUT_DIR_BASE, OUTPUT_DIR_RELATIVE),
            filename: outputFilenamePattern + '.js',
            publicPath: PUBLIC_PATH,
            pathinfo: true,
        },
        module: {
            // Mark it a hard error if import doesn't exist. This avoids confusing errors
            // where you import something that doesn't exist (so it's undefined) then try
            // to use it as a component and get an error from React about what it expects
            // a component to be.
            strictExportPresence: true,
            rules: [],
            // noParse: /jquery/,
        },
        plugins: [
            new webpack.DefinePlugin(getClientEnvironment(PUBLIC_PATH)),
            // Require case to match on imports - prevents builds breaking on
            // case sensitive filesystems
            new CaseSensitivePathsPlugin(),
            // When using moment exclude locales
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new WriteJsonFilePlugin({
                name: 'version.json',
                contents: { version: getVersion() },
            }),
            includeSentry &&
                new SentryWebpackPlugin({
                    include: path.join(__dirname, OUTPUT_DIR_BASE, OUTPUT_DIR_RELATIVE),
                    configFile: 'sentry.properties',
                    release: getVersion(),
                    urlPrefix: '~' + publicPathRoot + OUTPUT_DIR_RELATIVE,
                }),
            new webpack.LoaderOptionsPlugin({
                options: {
                    // Autoprefixing is done with postcss - postcss-loader
                    // included in getCssLoader
                    postcss: function() {
                        return [
                            autoprefixer({
                                browsers,
                            }),
                        ];
                    },
                },
            }),
            new EntryPointBundleTracker({
                filename:
                    OUTPUT_DIR_BASE +
                    OUTPUT_DIR_RELATIVE +
                    (isDev ? 'webpack-stats-dev.json' : 'webpack-stats.json'),
                indent: 2,
            }),
        ].filter(Boolean),
        optimization: {
            // minimizer settings were taken from
            // https://github.com/facebook/create-react-app/blob/next/packages/react-scripts/config/webpack.config.prod.js
            // They've done a good job of testing with React project so just piggy backing
            // of their work.
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        parse: {
                            // we want terser to parse ecma 8 code. However, we don't want it
                            // to apply any minfication steps that turns valid ecma 5 code
                            // into invalid ecma 5 code. This is why the 'compress' and 'output'
                            // sections only apply transformations that are ecma 5 safe
                            // https://github.com/facebook/create-react-app/pull/4234
                            ecma: 8,
                        },
                        compress: {
                            ecma: 5,
                            warnings: false,
                            // Disabled because of an issue with Uglify breaking seemingly valid code:
                            // https://github.com/facebook/create-react-app/issues/2376
                            // Pending further investigation:
                            // https://github.com/mishoo/UglifyJS2/issues/2011
                            comparisons: false,
                        },
                        mangle: {
                            safari10: true,
                        },
                        output: {
                            ecma: 5,
                            comments: false,
                            // Turned on because emoji and regex is not minified properly using default
                            // https://github.com/facebook/create-react-app/issues/2488
                            ascii_only: true,
                        },
                    },
                    // Use multi-process parallel running to improve the build speed
                    // Default number of concurrent runs: os.cpus().length - 1
                    parallel: true,
                    // Enable file caching
                    cache: true,
                    sourceMap: !!sourceMap,
                }),
                new OptimizeCSSAssetsPlugin(),
            ],
            splitChunks: {
                cacheGroups: {
                    // Vendor bundle contains anything from node_modules that's in a specific list of vendor packages.
                    // The intention here is to achieve long term caching on things that change infrequently.
                    vendor: {
                        name: 'vendor',
                        chunks: 'initial',
                        test(chunk) {
                            for (const pkg of vendorPackages) {
                                if (chunk.resource && chunk.resource.match(pkg)) {
                                    return true;
                                }
                            }
                            return false;
                        },
                        priority: 20,
                        minChunks: 2,
                    },
                    // Common bundle includes other code shared across at least two chunks.
                    common: {
                        name: 'common',
                        chunks: 'initial',
                        minChunks: 2,
                        priority: 10,
                        reuseExistingChunk: true,
                    },
                },
            },
            // Single runtime bundle rather than duplicating for each entry point
            runtimeChunk: 'single',
        },
        devServer: {
            compress: true,
            clientLogLevel: 'none',
            host: serverHost,
            port: serverPort,
            publicPath: PUBLIC_PATH,
            // This will hot-load if possible but if not it will reload the page
            // We can set to hotOnly to disable reload but seems desirable
            hot: hotReload,
            // Set this to disable above behaviour
            // hotOnly: true,
            quiet: true,
            // For React builds don't display the overlay, use the ErrorOverlay instead provided
            // by @alliance-software/webpack-dev-utils/server/dev-server
            overlay: !react,
            // Fixes some issues with hotloading
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            writeToDisk: true,
        },
    };

    if (isDev) {
        if (hotReload) {
            conf.plugins.push(
                ...[
                    // Enables HMR
                    new webpack.HotModuleReplacementPlugin(),
                    // Prints readable module names on HMR updates rather than a
                    // number
                    new webpack.NamedModulesPlugin(),
                ]
            );
        }
    } else {
        conf.plugins.push(
            ...[
                new MiniCssExtractPlugin({
                    filename: outputFilenamePattern + '.css',
                    chunkFilename: outputFilenamePattern + '.[id].css',
                }),
                // https://webpack.js.org/guides/caching/#module-identifiers
                new webpack.HashedModuleIdsPlugin(),
            ]
        );
    }

    // ------------------------------------------------------------------
    // Show bundle size stats
    //
    // for an alternative, see https://github.com/danvk/source-map-explorer
    if (!isDev && analyze) {
        const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
        conf.plugins.push(
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                reportFilename: 'report-analyze.html',
            })
        );
    }

    // ------------------------------------------------------------------
    // Config that may be modified by options
    const ignoreCssModulePaths = NODE_MODULES_PATHS.slice();
    const sassIncludePaths = [];
    const babelPresets = [
        [
            require.resolve('@babel/preset-env'),
            {
                targets: {
                    browsers,
                },
                useBuiltIns: 'entry',
                corejs: 3,
                // This enables webpack2 tree-shaking
                modules: false,
                debug: process.env.DEBUG_BUILD,
            },
        ],
        require.resolve('@babel/preset-flow'),
    ];

    const babelPluginsCommon = [
        // This loader allows svg's to be imported as components. Usage:
        // import { ReactComponent as PencilIcon } from './pencilIcon.svg';
        // or as a normal svg URL:
        // import svg from './pencilIcon.svg';
        // Uses https://github.com/smooth-code/svgr/ to convert SVG to component.
        [
            require.resolve('babel-plugin-named-asset-import'),
            {
                loaderMap: {
                    svg: {
                        ReactComponent: '@svgr/webpack![path]',
                    },
                },
            },
        ],
        // Lets us use import('path', () => { .. } ) syntax
        require.resolve('@babel/plugin-syntax-dynamic-import'),
        require.resolve('@babel/plugin-proposal-class-properties'),
        require.resolve('@babel/plugin-proposal-object-rest-spread'),
        require.resolve('@babel/plugin-transform-strict-mode'),
    ];
    const babelPluginsDev = [];
    const babelPluginsProd = [];

    // ----------------------------------------------------------------------
    if (react) {
        if (hotReload) {
            babelPluginsDev.push(require.resolve('react-hot-loader/babel'));
        }
        babelPresets.push(require.resolve('@babel/preset-react'));
        babelPluginsProd.push(
            require.resolve('babel-plugin-transform-react-remove-prop-types'),
            require.resolve('@babel/plugin-transform-react-constant-elements')
        );
    }

    // ant design
    if (antd) {
        // https://github.com/ant-design/babel-plugin-import
        //
        // babel-plugin-import is not strictly needed but does automatic removal of unused antd js components
        //
        // this is an exceedingly badly named plugin -- it is specific to antd only
        // see comments in styles/antd.less for why we don't use { "style": true }

        const antPlugin = [
            require.resolve('babel-plugin-import'),
            {
                libraryName: 'antd',
            },
        ];
        babelPluginsCommon.push(antPlugin);
    }

    // ----------------------------------------------------------------------
    // jQuery
    if (jQuery) {
        // This exposes jquery on the window to non-webpack JS
        // For it to work jquery must be included in an entry point's sources as simply 'jquery'
        conf.module.rules.push({
            test: require.resolve('jquery'),
            use: [
                {
                    loader: require.resolve('expose-loader'),
                    options: '$',
                },
            ],
        });
    }

    // ----------------------------------------------------------------------
    // bootstrap (sass version)
    if (bootstrap) {
        if (bootstrapSassIncludePath) {
            const bootstrapAssetsPath =
                path.resolve(getNodeModulePath('bootstrap-sass'), 'assets') + '/';
            sassIncludePaths.push(
                bootstrapAssetsPath + 'stylesheets/',
                bootstrapAssetsPath + 'fonts/'
            );
        }
    }

    // ------------------------------------------------------------------
    // Binary files
    conf.module.rules.push({
        test: /\.(jpg|jpeg|png|gif|eot|svg|ttf|woff|woff2)$/,
        loader: require.resolve('url-loader'),
        options: { limit: INLINE_BINARY_DATA_LIMIT },
    });

    // ------------------------------------------------------------------
    // JS
    conf.module.rules.push({
        test: /\.(js|jsx|mjs)$/,
        enforce: 'pre',
        use: [
            {
                options: {
                    formatter: eslintFormatter,
                    eslintPath: require.resolve('eslint'),
                    emitWarning: isDev,
                    // Prevent production builds if linting fails
                    failOnWarning: !isDev,
                    failOnError: !isDev,
                },
                loader: require.resolve('eslint-loader'),
            },
        ],
        exclude: [...NODE_MODULES_PATHS, path.resolve('../../js-packages/')],
    });
    conf.module.rules.push({
        test: /\.(js|jsx)$/,
        exclude: NODE_MODULES_PATHS,
        use: [
            // Currently causes some warnings / error messages to disappear when building
            // TODO: Investigate at some point
            // {
            //     loader: 'thread-loader',
            //     options: {
            //         poolTimeout: Infinity // keep workers alive for more effective watch mode
            //     },
            // },
            {
                loader: require.resolve('babel-loader'),
                options: {
                    presets: babelPresets,
                    env: {
                        development: {
                            plugins: babelPluginsCommon.concat(babelPluginsDev),
                        },
                        production: {
                            plugins: babelPluginsCommon.concat(babelPluginsProd),
                        },
                    },
                    babelrc: false,
                    // This is a feature of `babel-loader` for webpack (not Babel itself).
                    // It enables caching results in ./node_modules/.cache/babel-loader/
                    // directory for faster rebuilds.
                    cacheDirectory: true,
                },
            },
        ],
    });

    // ------------------------------------------------------------------
    // CSS/SCSS/less
    // extraLoaders can be a single loader or an array of loaders
    const getCssLoader = (extraLoaders = undefined, useCssModules = cssModules) => {
        // postcss is just used for autoprefixing
        const loaders = [
            {
                loader: require.resolve('postcss-loader'),
                options: {
                    plugins: () => [autoprefixer({ browsers })],
                    sourceMap: cssSourceMaps,
                },
            },
        ];

        if (extraLoaders) {
            if (_.isArray(extraLoaders)) {
                loaders.push(...extraLoaders);
            } else {
                loaders.push(extraLoaders);
            }
        }

        loaders.unshift({
            loader: require.resolve('css-loader'),
            options: {
                sourceMap: cssSourceMaps,
                importLoaders: loaders.length,
                modules: useCssModules,
                localIdentName: '[name]__[local]__[hash:base64:5]',
            },
        });

        // In production css extracted to file, dev uses style-loader to load
        // it from js
        const styleLoader = {
            loader: 'style-loader',
            options: {
                // Setting singleton: true can avoid flash of content in dev on load but has
                // downsides:
                // - Source maps no longer work
                // - Hot reload is slower
                // Note that the FOUC is cased by enabling source maps on css-loader - see
                // https://github.com/webpack-contrib/css-loader/issues/613
                // Possible solution is to switch to https://github.com/NeekSandhu/css-visor
                singleton: false,
                sourceMap: cssSourceMaps,
            },
        };
        return !isDev ? [MiniCssExtractPlugin.loader, ...loaders] : [styleLoader, ...loaders];
    };

    const cssRule = {
        test: /\.(css)$/,
        use: getCssLoader(undefined, false),
    };
    conf.module.rules.push(cssRule);
    if (sass) {
        const sassRule = {
            test: /\.(scss)$/,
            use: getCssLoader('sass-loader'),
        };
        conf.module.rules.push(sassRule);
    }
    if (less) {
        conf.module.rules.push({
            test: /\.(less)$/,
            oneOf: [
                // CSS Modules can be disabled by passing ?no-css-modules to import string
                // First rule matches that and disables css-modules
                {
                    resourceQuery: /no-css-modules/,
                    use: getCssLoader(
                        {
                            loader: require.resolve('less-loader'),
                            options: {
                                javascriptEnabled: antd,
                                sourceMap: cssSourceMaps,
                            },
                        },
                        false
                    ),
                },
                // Otherwise css-modules are enabled
                {
                    use: getCssLoader(
                        {
                            loader: require.resolve('less-loader'),
                            options: {
                                modules: true,
                                javascriptEnabled: antd,
                                sourceMap: cssSourceMaps,
                            },
                        },
                        true
                    ),
                },
            ],
        });
    }
    // ----------------------------------------------------------------------

    return conf;
};
