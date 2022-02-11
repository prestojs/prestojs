import fs from 'fs';
import path from 'path';
import { JSONOutput } from 'typedoc';

const _data = require('./___temp_util.json');

const data = _data as JSONOutput.ProjectReflection;
data.children?.[0].kindString === '';

const root = path.resolve(__dirname, '../../');

async function extractChildren(node: JSONOutput.DeclarationReflection) {
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
    let tagsByName: Record<string, any> = {};
    if (comment && comment.tags) {
        tagsByName = comment.tags.reduce((acc, tag) => {
            acc[tag.tag] = tag.text.trim();
            if (tag.param) {
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
        // const dir = root + '/' + node.sources[0].fileName.split('/').slice(0, -1).join('/') + '/';
        // if (comment.shortText && comment.shortText.includes('codesandbox=')) {
        //     console.log(
        //         'wow',
        //         comment.text,
        //         comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`)
        //     );
        //     comment.shortText = comment.shortText.replace(/codesandbox=/g, `codesandbox=${dir}`);
        // }
        // if (comment.text && comment.text.includes('codesandbox=')) {
        //     console.log(
        //         'wow',
        //         comment.text,
        //         comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`)
        //     );
        //     comment.text = comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`);
        // }
    }
    let mdx: string | null = null;
    // Hacky workaround to get param descriptions for function type aliases
    if (
        Object.keys(paramTags).length > 0 &&
        rest.kindString === 'Type alias' &&
        rest.type?.type === 'reflection' &&
        rest.type.declaration &&
        rest.type.declaration.signatures
    ) {
        rest.type.declaration.signatures[0].parameters?.forEach(param => {
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
    const docItem = {
        ...rest,
        mdx,
        isForwardRef,
        docClass,
        extractDocs,
        menuGroup,
        permaLink,
        packageName,
        childIds: children ? children.map(child => child.id) : [],
        children,
    };
    if (!node.children) {
        return [docItem];
    }
    const extractedChildren = [docItem];
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
    console.log('start');
    if (data.children) {
        // @ts-ignore
        const y = data.children[0];
        // TODO: types
        const x: any[] = [];
        for (const child of data.children) {
            x.push(...(await extractChildren(child)));
        }
        console.log(
            'yooo',
            x.filter(y => y.extractDocs)
        );
        const docsPath = path.resolve(__dirname, '../data/');

        for (const docItem of x) {
            if (!docItem.extractDocs) {
                continue;
            }
            const packageDir = `${docsPath}/${docItem.packageName}`;
            if (!fs.existsSync(packageDir)) {
                fs.mkdirSync(packageDir);
            }
            fs.writeFileSync(
                path.resolve(packageDir, `${docItem.name}.json`),
                JSON.stringify(docItem, null, 2)
            );
        }
    }
}

main();
