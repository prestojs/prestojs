module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['plugin:@typescript-eslint/recommended', 'prettier', 'prettier/@typescript-eslint'],
    rules: {
        '@typescript-eslint/no-explicit-any': 0,
        // disable the rule for all files
        '@typescript-eslint/explicit-function-return-type': 'off',
    },
    overrides: [
        {
            // enable the rule specifically for TypeScript files
            files: ['*.ts', '*.tsx'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': ['error'],
            },
        },
    ],
};
