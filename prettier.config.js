module.exports = {
    arrowParens: 'avoid',
    singleQuote: true,
    trailingComma: 'es5',
    tabWidth: 4,
    printWidth: 100,
    overrides: [
        {
            files: '*.less',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.json',
            options: {
                tabWidth: 2,
            },
        },
    ],
};
