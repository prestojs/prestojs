module.exports = api => {
    const isTest = api.env('test');

    return {
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
        ignore: isTest ? [] : ['**/__tests__'],
    };
};
