console.log(require.resolve('babel-plugin-import'));
module.exports = {
    presets: ['next/babel'],
    plugins: [
        'macros',
        [
            'import',
            {
                libraryName: 'antd',
                style: true,
            },
        ],
    ],
};
