/* eslint-disable */
const TypeDoc = require('typedoc');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../');

function getTsFiles(dir) {
    if (dir.endsWith('__tests__')) {
        return [];
    }
    const files = [];
    for (const f of fs.readdirSync(dir)) {
        if (f === 'index.ts') {
            continue;
        }
        const fn = path.join(dir, f);
        if (fs.statSync(fn).isDirectory()) {
            files.push(...getTsFiles(fn));
        } else if (fn.endsWith('ts') || fn.endsWith('tsx')) {
            files.push(fn);
        }
    }
    return files;
}

async function main() {
    const packagesRoot = path.resolve(repoRoot, 'js-packages/@prestojs/');

    for (const pkg of ['util', 'viewmodel', 'ui', 'final-form', 'ui-antd', 'routing', 'rest']) {
        //fs.readdirSync(packagesRoot)) {
        if (pkg === 'codegen') continue;
        const app = new TypeDoc.Application();

        app.options.addReader(new TypeDoc.TSConfigReader());
        const entryPoints = getTsFiles(path.join(packagesRoot, pkg, 'src/'));
        console.log(entryPoints);
        app.bootstrap({
            // entryPoints: [path.join(packagesRoot, pkg, 'src/index.ts')],
            entryPoints,
            tsconfig: path.join(packagesRoot, pkg, 'tsconfig.json'),
            plugin: [
                path.resolve(repoRoot, 'doc-site/plugins/forceExport.js'),
                'typedoc-plugin-rename-defaults',
                path.resolve(repoRoot, 'doc-site/plugins/fixSource.js'),
            ],
            'presto-root': repoRoot,
            'presto-package-root': path.join(packagesRoot, pkg),
        });

        const project = app.convert();

        const tmpFile = `./___temp_${pkg}.json`;
        await app.generateJson(project, tmpFile);
    }
}

main().catch(console.error);
