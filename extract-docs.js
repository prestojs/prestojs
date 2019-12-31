/* eslint-disable */
const typedoc = require('typedoc');
const fs = require('fs');

const app = new typedoc.Application();
const options = {
    target: 'es6',
    name: 'prestojs',
    mode: 'modules',
    ignoreCompilerErrors: true,
    preserveConstEnums: true,
    exclude: ['*.test.ts', '*.test.tsx', '*/**/__tests__/**/*'],
    'external-modulemap': '.*packages/(@prestojs/[^/]+)/.*',
    stripInternal: false,
    stripExternal: true,
    tsconfig: './tsconfig.json',
};
const result = app.bootstrap(options);

if (result.hasErrors) {
    process.exit(typedoc.ExitCode.OptionError);
}

const src = app.expandInputFiles(['js-packages/']);
const project = app.convert(src);
const tmpFile = './___temp.json';
app.generateJson(project, tmpFile);
const data = require(tmpFile);
fs.unlinkSync(tmpFile);

const transformedData = data.children.filter(child => child.name.startsWith('@presto'));

function extractChildren(node) {
    const { children, ...rest } = node;
    if (children) {
        rest.childIds = children.map(child => child.id);
    }
    if (!node.children) {
        return [rest];
    }
    return node.children.reduce(
        (acc, child) => {
            acc.push(...extractChildren(child));
            return acc;
        },
        [rest]
    );
}

fs.writeFileSync(
    './doc-site/data/typeDocs.json',
    JSON.stringify(
        transformedData.reduce((acc, child) => {
            acc.push(...extractChildren(child));
            return acc;
        }, []),
        null,
        2
    )
);
