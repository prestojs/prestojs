// eslint-disable-next-line @typescript-eslint/no-var-requires
const withMDX = require('@next/mdx')({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [require('remark-code-import')],
    },
});
module.exports = withMDX({
    pageExtensions: ['js', 'jsx', 'mdx'],
    webpack: config => {
        config.module.rules.push({
            test: /\.svg$/,
            issuer: {
                test: /\.(js|ts)x?$/,
            },
            use: ['@svgr/webpack'],
        });
        // Using react-view was getting issues with "Can't resolve 'fs' in '....@babel/core/lib/transformation'
        // This seems wrong but it seems to fix it
        config.node = {
            fs: 'empty',
        };
        return config;
    },
    webpackDevMiddleware: config => {
        // Perform customizations to webpack dev middleware config
        // Important: return the modified config
        return config;
    },
    // This makes it so next export works with our linking but now without trailing
    // slash in dev you get 404's. To fix dev as well we set `trailingSlash` to true.
    // Without this option everything must have .html suffix... but trying to get that
    // working in dev also failed (worked in dev but doing a build would complain
    // about moving a file with a .html.html extension...)
    exportTrailingSlash: true,
    trailingSlash: true,
});
