module.exports = {
    rootDir: '.',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    globals: {
        'ts-jest': {
            tsconfig: './tsconfig.json',
            diagnostics: {
                warnOnly: true,
            },
        },
    },
};
