module.exports = {
    setupFilesAfterEnv: ['jest-dom/extend-expect', 'react-testing-library/cleanup-after-each'],
    clearMocks: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'clover'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    globals: {
        'ts-jest': {
            extends: './babel.config.js',
        },
    },
    moduleDirectories: ['node_modules'],
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    modulePathIgnorePatterns: [],
    moduleNameMapper: {
        '@xenopus/([^/]+)$': '<rootDir>js-packages/@xenopus/$1/src',
        '@xenopus/([^/]+)(/.+)$': '<rootDir>js-packages/@xenopus/$1/src$2',
    },
    notify: true,
    notifyMode: 'always',
    roots: ['<rootDir>js-packages'],
    testMatch: ['**/src/**/__tests__/*.+(ts|tsx|js)', '**/src/**/*.test.+(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
};
