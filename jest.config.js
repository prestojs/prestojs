// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pathsToModuleNameMapper } = require('ts-jest/utils');
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { compilerOptions } = require('./tsconfig.base');

const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' });

module.exports = {
    setupFilesAfterEnv: ['<rootDir>js-testing/setupTests.ts'],
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
            diagnostics: {
                warnOnly: true,
            },
        },
    },
    moduleDirectories: ['node_modules', 'js-testing'],
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    modulePathIgnorePatterns: [],
    moduleNameMapper,
    // When true I end up with many terminal-notifier processes and 'usernoted' process pegging cpu at 100%
    notify: false,
    notifyMode: 'always',
    roots: ['<rootDir>js-packages'],
    testMatch: ['**/src/**/__tests__/*.+(ts|tsx|js)', '**/src/**/*.test.+(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
};
