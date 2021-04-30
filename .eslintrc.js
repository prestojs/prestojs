module.exports = {
    parser: require.resolve('@typescript-eslint/parser'),
    plugins: ['@typescript-eslint', 'react', 'react-hooks', 'no-only-tests'],
    extends: ['plugin:@typescript-eslint/recommended', 'prettier', 'prettier/@typescript-eslint'],
    rules: {
        'no-only-tests/no-only-tests': [
            'error',
            { block: ['test', 'it', 'assert', 'describe'], focus: ['only', 'focus', 'skip'] },
        ],
        '@typescript-eslint/no-explicit-any': 0,
        // disable the rule for all files
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-use-before-define': ['error', { ignoreTypeReferences: true }],
        '@typescript-eslint/ban-types': [
            'error',
            {
                extendDefaults: true,
                types: {
                    Function: false,
                    '{}': false,
                },
            },
        ],
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'prefer-const': 0,
    },
    overrides: [
        {
            // enable the rule specifically for TypeScript files
            files: ['*.ts', '*.tsx'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': ['error'],
            },
        },
        {
            // enable the rule specifically for TypeScript files
            files: ['doc-site/**/*.ts', 'doc-site/**/*.tsx'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': 'off',
            },
        },
    ],
};
