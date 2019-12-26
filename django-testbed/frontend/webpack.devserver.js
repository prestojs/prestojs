const webpackProjectConfig = require('./webpack.project.config');
const startServer = require('@alliance-software/webpack-dev-utils/server/dev-server');

startServer('0.0.0.0', 3033, webpackProjectConfig.development);
