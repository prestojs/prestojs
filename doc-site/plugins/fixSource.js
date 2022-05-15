const { Converter } = require('typedoc'); // version 0.20.x
const path = require('path');
/**
 * For some reason some packages wouldn't get the full path relative to the package for
 * source files. eg. for ui package you would get useUi.ts instead of "js-packages/@prestojs/ui/useUi"
 * which broke how we work out what package etc it belongs to later
 */
exports.load = function (app) {
    app.options.addDeclaration({
        name: 'presto-root',
        help: 'Package prefix used to fixup sources',
    });
    app.options.addDeclaration({
        name: 'presto-package-root',
        help: 'Package prefix used to fixup sources',
    });
    app.converter.on(Converter.EVENT_RESOLVE, (context, reflection) => {
        const root = app.options.getValue('presto-root');
        let packageRoot = app.options.getValue('presto-package-root').replace(root, '');
        if (packageRoot[0] === '/') {
            packageRoot = packageRoot.slice(1);
        }
        if (reflection.sources) {
            reflection.sources.forEach(source => {
                if (
                    source.file.fullFileName.startsWith(root) &&
                    !source.fileName.startsWith(packageRoot)
                ) {
                    source.fileName = path.join(packageRoot, source.fileName);
                }
            });
        }
    });
};
