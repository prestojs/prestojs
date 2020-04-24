/* eslint-disable */
const typedoc = require('typedoc');
const fs = require('fs');
const path = require('path');

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
    tsconfig: '../tsconfig.json',
};
const result = app.bootstrap(options);

if (result.hasErrors) {
    process.exit(typedoc.ExitCode.OptionError);
}

const src = app.expandInputFiles(['../js-packages/']);
const project = app.convert(src);
const tmpFile = './___temp.json';
app.generateJson(project, tmpFile);
const data = require(tmpFile);
fs.unlinkSync(tmpFile);

const transformedData = data.children.filter(child => child.name.startsWith('@presto'));

function extractChildren(node) {
    const { children, ...rest } = node;
    let extractDocs = false;
    let { comment } = rest;
    if (rest.kindString === 'Function' && rest.signatures && rest.signatures.length > 0) {
        comment = rest.signatures[0].comment;
    }
    if (comment && comment.tags) {
        const tagsByName = comment.tags.reduce((acc, tag) => {
            acc[tag.tag] = tag.text.trim();
            return acc;
        }, {});
        extractDocs = 'extract-docs' in tagsByName;
        comment.tagsByName = tagsByName;
    }
    rest.extractDocs = extractDocs;
    const { fileName } = rest.sources[0];
    const importPath = fileName
        .replace('js-packages/', '')
        .replace('src/', '')
        .split('.')[0];
    const slug = [...importPath.split('/').slice(0, -1), rest.name].join('/');
    const permaLink = slug
        .split('/')
        .slice(1)
        .join('/');
    const [, packageName, ...names] = slug.split('/');
    rest.slug = permaLink;
    rest.packageName = packageName;
    if (children) {
        rest.childIds = children.map(child => child.id);
    }
    rest.children = children;
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

const finalData = transformedData.reduce((acc, child) => {
    acc.push(...extractChildren(child));
    return acc;
}, []);

const byId = finalData.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
}, {});

function updateObjects(obj, fn) {
    if (fn(obj)) {
        return;
    }
    for (const value of Object.values(obj)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                if (value && typeof value == 'object') {
                    updateObjects(v, fn);
                }
            }
        } else if (value && typeof value == 'object') {
            updateObjects(value, fn);
        }
    }
    return obj;
}

updateObjects(byId, obj => {
    if (obj.type === 'reference' && byId[obj.id] && byId[obj.id].extractDocs) {
        obj.referenceSlug = byId[obj.id].slug;
    }
    if (obj.tags) {
        obj.tagsByName = obj.tags.reduce((acc, tag) => {
            acc[tag.tag] = tag.text.trim();
            if (acc[tag.tag] === '') {
                acc[tag.tag] = true;
            }
            if (tag.tag === 'expand-properties' && acc[tag.tag] !== true) {
                // Hack to have mdx transform work on it
                acc[tag.tag] = {
                    comment: { text: acc[tag.tag] },
                };
            }
            return acc;
        }, {});
    }
});

fs.writeFileSync('./data/typeDocs.json', JSON.stringify(finalData, null, 2));

const menuByName = {};
for (const datum of finalData) {
    if (datum.extractDocs) {
        const slug = datum.slug.split('/').filter(Boolean);
        menuByName[datum.packageName] = menuByName[datum.packageName] || [];
        menuByName[datum.packageName].push({
            title: datum.name,
            slug: slug.join('/'),
        });
    }
}

fs.writeFileSync('./data/apiMenu.json', JSON.stringify(menuByName, null, 2));
