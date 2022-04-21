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
