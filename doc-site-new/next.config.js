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

const withMDX = require('@next/mdx')({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [],
        rehypePlugins: [],
        // If you use `MDXProvider`, uncomment the following line.
        // providerImportSource: "@mdx-js/react",
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    lessLoaderOptions: {
        lessOptions: {
            javascriptEnabled: true,
        },
    },
    reactStrictMode: true,
    webpack: (config, { isServer, defaultLoaders }) => {
        if (!isServer) {
            config.resolve.fallback.fs = false;
        }
        // Process ui-antd with babel so that babel-plugin-import runs on it and imports necessary styles
        // config.module.rules.push({
        //     test: /\.+(js|jsx|mjs|ts|tsx)$/,
        //     loader: defaultLoaders.babel,
        //     include: /@prestojs\//,
        // });
        return config;
    },
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};
const withLess = require('next-with-less');
// const withAntdLess = require('next-plugin-antd-less');
const withPlugins = require('next-compose-plugins');

module.exports = withPlugins([withTM, withLess, withMDX], nextConfig);
