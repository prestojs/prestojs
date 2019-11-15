'use strict';

const _ = require('lodash');
const process = require('process');

const disableSentry = process.argv.includes('--disable-sentry');

const webpackGenericConfig = require('./webpack.generic.config');

// TODO: currently babel-polyfill includes every potential polyfill; see:
//  https://github.com/babel/babel/issues/6625
//  https://github.com/babel/babel/issues/6626
//
// Adding babel-polyfill as an entrypoint seems to ignore babel-env settings, so instead we import it in
// vendor-common which appears to work

const commonSettings = {
    // insert project-specific settings here
    bootstrap: false,
    jQuery: false,
    react: true,
    antd: true,
    // bundle definitions
    entryPoints: {
        app: ['./src/index.js'],
    },
    vendorPackages: [],
    chunkHash: false,
    analyze: true,
    hotReload: true,
};

// Entries we want in (almost) every bundle
_.forOwn(commonSettings.entryPoints, (sources, bundle) => {
    if (bundle != 'vendor-jquery') {
        // sources.unshift('whatwg-fetch');
    }
});

module.exports = {
    commonSettings: commonSettings,
    production: () =>
        webpackGenericConfig(
            Object.assign(
                {
                    environment: 'production',
                    includeSentry: !disableSentry,
                    sourceMap: !disableSentry,
                },
                commonSettings
            )
        ),
    development: (extraConfig = {}) =>
        webpackGenericConfig(
            Object.assign(
                {
                    environment: 'development',
                },
                extraConfig,
                commonSettings
            )
        ),
};
