module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                modules: false,
            },
        ],
        '@babel/typescript',
    ],
    plugins: ['@babel/proposal-class-properties', '@babel/proposal-object-rest-spread'],
};
