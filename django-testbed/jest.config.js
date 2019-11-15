module.exports = {
    setupFilesAfterEnv: [
        '@babel/polyfill',
        'jest-dom/extend-expect',
        'react-testing-library/cleanup-after-each',
    ],
    transformIgnorePatterns: ['/node_modules/(?!@alliance-software/djrad).+\\.js$'],
    moduleNameMapper: {
        // Support css-modules - styles object will be returned as-is (e.g., styles.foobar === 'foobar')
        '\\.(css|less)$': 'identity-obj-proxy',
    },
};
