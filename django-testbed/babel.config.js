// This is just used for running jest tests. Normal babel config is in
// webpack.generic.config.js
module.exports = {
    presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-flow'],
    plugins: ['@babel/plugin-proposal-class-properties'],
};
