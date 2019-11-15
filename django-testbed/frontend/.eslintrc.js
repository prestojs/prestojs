const assert = require('assert');
const path = require('path');
const react = require('./webpack.project.config.js').commonSettings.react;
assert(
    react !== undefined,
    'react can no longer be blank in webpack.project.config; please set it to true or false'
);
const globals = react
    ? {
          __DEBUG__: false,
          __DEBUG_NEW_WINDOW__: false,
      }
    : {};
module.exports = {
    parser: 'babel-eslint',
    extends: [
        react ? '@alliance-software/eslint-config-react' : '@alliance-software/eslint-config',
    ],
    rules: {
        'import/no-unresolved': [
            'error',
            { ignore: ['.*\\.(scss|less|css)\\?no-css-modules', '@xenopus/*'] },
        ],
        'import/extensions': ['error', { ignore: ['@xenopus/*'] }],
        'import/no-restricted-paths': [
            'error',
            {
                basePath: path.resolve(__dirname, 'src/'),
                // Don't allow importing between different djrad sites
                // Any shared code should go in common.
                zones: [
                    {
                        target: './admin',
                        from: './app',
                    },
                    {
                        target: './app',
                        from: './admin',
                    },
                ],
            },
        ],
    },
    globals,
    env: {
        browser: true,
        jquery: !react,
    },
};
