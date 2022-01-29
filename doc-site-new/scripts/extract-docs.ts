import fs from 'fs';
import path from 'path';
import { JSONOutput } from 'typedoc';

const _data = require('./___temp_util.json');

const data = _data as JSONOutput.ProjectReflection;
data.children?.[0].kindString === '';

const root = path.resolve(__dirname, '../../');

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
        const dir = root + '/' + node.sources[0].fileName.split('/').slice(0, -1).join('/') + '/';
        if (comment.shortText && comment.shortText.includes('codesandbox=')) {
            console.log(
                'wow',
                comment.text,
                comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`)
            );
            comment.shortText = comment.shortText.replace(/codesandbox=/g, `codesandbox=${dir}`);
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
    if (!rest.sources) {
        // TODO: But why
        return [];
    }
    const { fileName } = rest.sources[0];
    const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
    const slug = [...importPath.split('/').slice(0, -1), rest.name].join('/');
    const permaLink = slug.split('/').slice(1).join('/');
    const [, packageName, ...names] = slug.split('/');
    const exampleKey = importPath.replace('@prestojs/', '');
    // const examples = exampleFiles[exampleKey];
    // if (examples) {
    //     pickedExamples.push(exampleKey);
    //     rest.examples = examples;
    // }
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
        if (child.kindString === 'Namespace') {
            // This is specifically for the typedoc-plugin-missing-exports plugin which adds internal types into
            // a namespace called <internal>
            child.sources = node.sources;
        }
        extractedChildren.push(...(await extractChildren(child)));
    }
    return extractedChildren;
}

async function main() {
    if (data.children) {
        // @ts-ignore
        const x = await extractChildren(data.children[0]);
        console.log(
            'yooo',
            x.filter(y => y.extractDocs)
        );
        fs.writeFileSync(
            path.resolve(__dirname, '../data/typeDocs.json'),
            JSON.stringify(x, null, 2)
        );
    }
}

main();
