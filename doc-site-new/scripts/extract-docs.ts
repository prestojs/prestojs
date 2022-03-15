import { AugmentedDeclarationReflection } from '@prestojs/doc';
import fs from 'fs';
import path from 'path';
import { JSONOutput } from 'typedoc';

const _data = require('./___temp_util.json');

const data = _data as JSONOutput.ProjectReflection;
data.children?.[0].kindString === '';

const root = path.resolve(__dirname, '../../');

async function extractChildren(
    node: JSONOutput.DeclarationReflection
): Promise<AugmentedDeclarationReflection[]> {
    let comment = node.comment;
    if (node.kindString === 'Function' && node.signatures && node.signatures.length > 0) {
        comment = node.signatures[0].comment;
    }
    const paramTags = {};
    let returnTagText;
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
    }
    if (!node.sources) {
        // TODO: But why
        return [];
    }
    const docItem: AugmentedDeclarationReflection = {
        ...node,
        tagsByName,
    };
    if (!node.children) {
        return [docItem];
    }
    const extractedChildren: AugmentedDeclarationReflection[] = [docItem];
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

function traverse(obj, fn, visitedTracker = new Map()) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (visitedTracker.has(obj)) {
        return obj;
    }
    visitedTracker.set(obj, true);

    if (fn(obj)) {
        return obj;
    }
    for (const value of Object.values(obj)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                if (value && typeof value == 'object') {
                    traverse(v, fn, visitedTracker);
                }
            }
        } else if (value && typeof value == 'object') {
            traverse(value, fn, visitedTracker);
        }
    }
    return obj;
}

async function main() {
    if (data.children) {
        // @ts-ignore
        const y = data.children[0];
        const x: AugmentedDeclarationReflection[] = [];
        for (const child of data.children) {
            x.push(...(await extractChildren(child)));
        }
        const docsPath = path.resolve(__dirname, '../data/');

        fs.writeFileSync(path.resolve(docsPath, `all.json`), JSON.stringify(x, null, 2));

        const byId = {};
        for (const docItem of x) {
            byId[docItem.id] = docItem;
        }
        const visitedTracker = new Map();
        for (const docItem of x) {
            const { tagsByName = {} } = docItem;
            const extractDocs = 'extract-docs' in tagsByName;
            if (!extractDocs) {
                continue;
            }
            const menuGroup = tagsByName['menu-group'] || 'default';
            const references = {};
            if (docItem.name === 'useAsync') {
                const fn = obj => {
                    const { comment } = obj;
                    if (comment && comment.tags) {
                        for (const tag of comment.tags) {
                            const text = tag.text.trim();
                            if (tag.tag === 'deprecated') {
                                obj.deprecated = text || true;
                            }
                        }
                    }
                    if (obj.type === 'reference' && byId[obj.id]) {
                        references[obj.id] = traverse([byId[obj.id]], fn, visitedTracker);
                    }
                };
                traverse(docItem, fn, visitedTracker);
            }
            const { fileName = '' } = docItem.sources?.[0] || {};
            const importPath = fileName
                .replace('js-packages/', '')
                .replace('src/', '')
                .split('.')[0];
            const slug = [...importPath.split('/').slice(0, -1), docItem.name].join('/');
            const permaLink = slug.split('/').slice(1).join('/');
            const [, packageName] = slug.split('/');
            const packageDir = `${docsPath}/${packageName}`;
            if (!fs.existsSync(packageDir)) {
                fs.mkdirSync(packageDir);
            }
            fs.writeFileSync(
                path.resolve(packageDir, `${docItem.name}.json`),
                JSON.stringify(
                    {
                        node: docItem,
                        references,
                        meta: {
                            packageName,
                            permaLink,
                            menuGroup,
                        },
                    },
                    null,
                    2
                )
            );
        }
    }
}

main();
