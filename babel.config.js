module.exports = api => {
    const isTest = api.env('test');

    const modules =
        process.env['BABEL_MODULES'] === 'esmodule' ? false : process.env['BABEL_MODULES'];
    return {
        presets: [
            [
                '@babel/preset-env',
                {
                    modules,
                    targets: !modules
                        ? {
                              esmodules: true,
                          }
                        : {
                              browsers: [
                                  'last 2 versions',
                                  'Firefox ESR',
                                  '> 1%',
                                  'ie >= 11',
                                  'iOS >= 8',
                                  'Android >= 4',
                              ],
                          },
                },
            ],
            '@babel/typescript',
            '@babel/preset-react',
        ],
        plugins: [
            '@babel/proposal-class-properties',
            '@babel/proposal-object-rest-spread',
            '@babel/plugin-proposal-nullish-coalescing-operator',
            '@babel/plugin-proposal-optional-chaining',
        ],
        ignore: isTest ? [] : ['**/__tests__'],
    };
};
