const withTM = require('next-transpile-modules')([
    '@prestojs/viewmodel',
    '@prestojs/ui',
    '@prestojs/ui-antd',
    '@prestojs/rest',
    '@prestojs/util',
    '@prestojs/routing',
    '@prestojs/final-form',
    '@prestojs/doc',
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
    lessLoaderOptions: {
        lessOptions: {
            javascriptEnabled: true,
        },
    },
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback.fs = false;
        }
        return config;
    },
};
const withLess = require('next-with-less');
// const withAntdLess = require('next-plugin-antd-less');
const withPlugins = require('next-compose-plugins');

module.exports = withPlugins([withTM, withLess], nextConfig);
