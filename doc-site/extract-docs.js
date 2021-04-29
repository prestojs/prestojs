/* eslint-disable */
const babel = require('@babel/core');
const prettier = require('prettier');
const typedoc = require('typedoc');
const fs = require('fs');
const path = require('path');
var remark = require('remark');

function readDirRecursive(dir) {
    const files = [];
    for (const fn of fs.readdirSync(dir)) {
        const p = path.resolve(dir, fn);
        if (fs.statSync(p).isDirectory()) {
            files.push(...readDirRecursive(p));
        } else {
            files.push(p);
        }
    }
    return files;
}

const examplesDir = path.resolve(__dirname, 'pages/examples/');
const exampleFiles = readDirRecursive(examplesDir).reduce((acc, fn) => {
    const relativePath = fn.replace(examplesDir, '').split('.')[0].replace(/^\//, '');
    const parts = relativePath.split('/');
    const exampleName = parts.pop();
    const key = parts.join('/');
    if (!acc[key]) {
        acc[key] = [];
    }
    let source = fs.readFileSync(fn).toString();
    const match = source.match(/\/\*\*(.*)\n[ ]*\*\/(.*)/s);
    let header = { title: exampleName };
    if (match) {
        const headerText = match[1].trim().replace(/^[ ]*\*/gm, '');
        const [title, ...body] = headerText.split('\n');
        header = { title, description: body.join('\n').trim() };
        source = match[2];
    }
    acc[key].push({
        name: exampleName,
        url: '/examples/' + relativePath,
        header,
        code: {
            js: prettier.format(
                babel.transformSync(source, {
                    filename: fn.split('/').pop(),
                    babelrc: false,
                    configFile: false,
                    presets: [['@babel/preset-typescript', { isTSX: true, allExtensions: true }]],
                }).code,
                { parser: 'babel' }
            ),
            ts: source,
        },
    });
    return acc;
}, {});
const pickedExamples = [];

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

const root = path.resolve(__dirname, '../');
const src = app.expandInputFiles(['../js-packages/']);
const project = app.convert(src);
const tmpFile = './___temp.json';
app.generateJson(project, tmpFile);
const data = require(tmpFile);
fs.unlinkSync(tmpFile);

async function process() {
    const transformedData = data.children.filter(child => child.name.startsWith('@presto'));

    async function extractChildren(node) {
        const { children, ...rest } = node;
        let extractDocs = false;
        let menuGroup;

        let { comment } = rest;
        if (rest.kindString === 'Function' && rest.signatures && rest.signatures.length > 0) {
            comment = rest.signatures[0].comment;
        }
        const paramTags = {};
        let returnTagText;
        let docClass;
        let isForwardRef = false;
        if (comment && comment.tags) {
            const tagsByName = comment.tags.reduce((acc, tag) => {
                acc[tag.tag] = tag.text.trim();
                if (tag.tag === 'param') {
                    paramTags[tag.param] = tag.text;
                }
                if (tag.tag === 'return' || tag.tag === 'returns') {
                    returnTagText = tag.text;
                }
                return acc;
            }, {});
            extractDocs = 'extract-docs' in tagsByName;
            docClass = tagsByName['doc-class'];
            menuGroup = tagsByName['menu-group'] || 'default';
            isForwardRef = 'forward-ref' in tagsByName;
            comment.tagsByName = tagsByName;
            const dir =
                root + '/' + node.sources[0].fileName.split('/').slice(0, -1).join('/') + '/';
            if (comment.shortText && comment.shortText.includes('codesandbox=')) {
                console.log(
                    'wow',
                    comment.text,
                    comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`)
                );
                comment.shortText = comment.shortText.replace(
                    /codesandbox=/g,
                    `codesandbox=${dir}`
                );
            }
            if (comment.text && comment.text.includes('codesandbox=')) {
                console.log(
                    'wow',
                    comment.text,
                    comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`)
                );
                comment.text = comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`);
            }
        }
        rest.isForwardRef = isForwardRef;
        rest.docClass = docClass;
        rest.extractDocs = extractDocs;
        rest.menuGroup = menuGroup;
        // Hacky workaround to get param descriptions for function type aliases
        if (
            Object.keys(paramTags).length > 0 &&
            rest.kindString === 'Type alias' &&
            rest.type.type === 'reflection' &&
            rest.type.declaration &&
            rest.type.declaration.signatures
        ) {
            rest.type.declaration.signatures[0].parameters.forEach(param => {
                if (paramTags[param.name]) {
                    param.comment = {
                        text: paramTags[param.name],
                    };
                }
            });
            rest.type.declaration.signatures[0].comment =
                rest.type.declaration.signatures[0].comment || {};
            if (returnTagText) {
                rest.type.declaration.signatures[0].comment.returns = returnTagText;
            }
        }
        const { fileName } = rest.sources[0];
        const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
        const slug = [...importPath.split('/').slice(0, -1), rest.name].join('/');
        const permaLink = slug.split('/').slice(1).join('/');
        const [, packageName, ...names] = slug.split('/');
        const exampleKey = importPath.replace('@prestojs/', '');
        const examples = exampleFiles[exampleKey];
        if (examples) {
            pickedExamples.push(exampleKey);
            rest.examples = examples;
        }
        rest.slug = permaLink;
        rest.packageName = packageName;
        if (children) {
            rest.childIds = children.map(child => child.id);
        }
        rest.children = children;
        if (!node.children) {
            return [rest];
        }
        const extractedChildren = [rest];
        for (const child of node.children) {
            extractedChildren.push(...(await extractChildren(child)));
        }
        return extractedChildren;
    }

    const finalData = [];

    for (const child of transformedData) {
        finalData.push(...(await extractChildren(child)));
    }

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
                if (tag.tag === 'hide-properties') {
                    acc[tag.tag] = tag.text.trim().split(' ');
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
            const groupName = datum.menuGroup;
            menuByName[datum.packageName] = menuByName[datum.packageName] || {};
            menuByName[datum.packageName][groupName] =
                menuByName[datum.packageName][groupName] || [];
            menuByName[datum.packageName][groupName].push({
                title: datum.name,
                slug: slug.join('/'),
            });
        }
    }

    fs.writeFileSync('./data/apiMenu.json', JSON.stringify(menuByName, null, 2));

    const missedExamples = Object.keys(exampleFiles).filter(key => !pickedExamples.includes(key));
    if (missedExamples.length > 0) {
        console.error(`There are example files that were not matched to a source file:
    
${missedExamples.join('\n')}
    `);
    }
}

process();
