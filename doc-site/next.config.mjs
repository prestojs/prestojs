import nextMdx from '@next/mdx';
import withPlugins from 'next-compose-plugins';
import requireTranspileModules from 'next-transpile-modules';
import withLess from 'next-with-less';
import { visit } from 'unist-util-visit';
import { getStaticPaths } from './util.mjs';

const withTM = requireTranspileModules ([
    '@prestojs/viewmodel',
    '@prestojs/ui',
    '@prestojs/ui-antd',
    '@prestojs/rest',
    '@prestojs/util',
    '@prestojs/routing',
    '@prestojs/final-form',
    '@prestojs/doc',
]);

function docLinks() {
    const pathsByName = getStaticPaths().paths.reduce((acc, { params }) => {
        const { slug } = params;
        const name = slug[slug.length - 1];
        acc[name] = `/docs/${slug.join('/')}`;
        return acc
    }, {});

    return () => tree => {
        visit(tree, ['link', 'linkReference'], node => {
            if (node.url && node.url.startsWith('doc:')) {
                const [name, hash] = node.url.split(':')[1].split('#');
                const target = pathsByName[name];
                if (target) {
                    let url = target;
                    if (hash) {
                        url += `#${hash}`;
                    }
                    node.url = url;
                } else {
                    console.warn(`${node.url} does not match the name of any documented item`);
                }
            }
        });
    };
}

const withMDX = nextMdx({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [docLinks()],
        rehypePlugins: [],
        providerImportSource: '@mdx-js/react',
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // lessLoaderOptions: {
    //     lessOptions: {
    //         javascriptEnabled: true,
    //     },
    // },
    reactStrictMode: true,
    // webpack: (config, { isServer, defaultLoaders }) => {
    //     if (!isServer) {
    //         config.resolve.fallback.fs = false;
    //     }
    //     // Process ui-antd with babel so that babel-plugin-import runs on it and imports necessary styles
    //     // config.module.rules.push({
    //     //     test: /\.+(js|jsx|mjs|ts|tsx)$/,
    //     //     loader: defaultLoaders.babel,
    //     //     include: /@prestojs\//,
    //     // });
    //     return config;
    // },
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    staticPageGenerationTimeout: 180,
    distDir: '../.next',
};
// const withAntdLess = require('next-plugin-antd-less');

export default withPlugins([withTM, withLess, withMDX], nextConfig);
