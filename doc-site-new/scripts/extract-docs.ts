import { compile } from '@mdx-js/mdx';
import { DeclarationReflection } from '@prestojs/doc';
import fs from 'fs';
import { createRequire } from 'module';
import path, { dirname } from 'path';
import { JSONOutput, ReflectionKind } from 'typedoc';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const _data = require('./___temp_util.json');

const data = _data as JSONOutput.ProjectReflection;
data.children?.[0].kindString === '';

const root = path.resolve(__dirname, '../../');

async function compileMdx(code) {
    try {
        return String(
            await compile(code.trim(), {
                outputFormat: 'function-body',
                providerImportSource: '@mdx-js/react',
            })
        );
    } catch (e) {
        return code;
    }
}

async function extractChildren(
    node: JSONOutput.DeclarationReflection
): Promise<DeclarationReflection[]> {
    if (!node.sources) {
        // TODO: But why
        return [];
    }
    const docItem: DeclarationReflection = {
        ...(node as DeclarationReflection),
        docFlags: {},
        tagsByName: {},
    };
    if (!node.children) {
        return [docItem];
    }
    const extractedChildren: DeclarationReflection[] = [docItem];
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

async function traverse(obj, fn, visitedTracker = new Map()) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (visitedTracker.has(obj)) {
        return obj;
    }
    visitedTracker.set(obj, true);
    if (await fn(obj)) {
        return obj;
    }
    for (const value of Array.isArray(obj) ? obj : Object.values(obj)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                if (value && typeof value == 'object') {
                    await traverse(v, fn, visitedTracker);
                }
            }
        } else if (value && typeof value == 'object') {
            await traverse(value, fn, visitedTracker);
        }
    }
    return obj;
}

async function main() {
    if (data.children) {
        // @ts-ignore
        const y = data.children[0];
        const x: DeclarationReflection[] = [];
        for (const child of data.children) {
            x.push(...(await extractChildren(child)));
        }
        const docsPath = path.resolve(__dirname, '../data/');

        fs.writeFileSync(path.resolve(docsPath, `all.json`), JSON.stringify(x, null, 2));

        const byId = {};
        for (const docItem of x) {
            byId[docItem.id] = docItem;
            if (docItem.name === 'useAsync')
                await traverse(docItem, node => {
                    if ([ReflectionKind.TypeParameter].includes(node.kind)) {
                        byId[node.id] = node;
                    }
                });
        }
        const visitedTracker = new Map();
        for (const docItem of x) {
            let comment = docItem.comment;
            if (
                docItem.kindString === 'Function' &&
                docItem.signatures &&
                docItem.signatures.length > 0
            ) {
                comment = docItem.signatures[0].comment;
            }
            if (!comment?.tags?.find(tag => tag.tag === 'extract-docs')) {
                continue;
            }
            const references = {};
            const fn = async obj => {
                const { comment } = obj;
                if (obj.id && obj.type !== 'reference') {
                    if (!obj.docFlags) {
                        obj.docFlags = {};
                    }
                    visitedTracker.set(obj.docFlags, true);
                    if (!obj.tagsByName) {
                        obj.tagsByName = {};
                    }
                    visitedTracker.set(obj.tagsByName, true);
                }
                if (comment) {
                    if (comment.shortText) {
                        comment.shortTextMdx = await compileMdx(comment.shortText);
                    }
                    if (comment.text) {
                        comment.textMdx = await compileMdx(comment.text);
                    }
                    if (comment.returns) {
                        comment.returnsMdx = await compileMdx(comment.returns);
                    }
                    if (comment.tags) {
                        for (const tag of comment.tags) {
                            const text = tag.text.trim();
                            if (tag.tag === 'deprecated') {
                                obj.docFlags.deprecated = text ? await compileMdx(text) : true;
                            }
                            if (tag.tag === 'expand-properties') {
                                obj.docFlags.expandProperties = true;
                            }
                        }
                        let tagsByName: Record<string, any> = {};
                        const paramTags = {};
                        let returnTagText;
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
                        obj.tagsByName = tagsByName;
                    }
                }
                if (obj.type === 'reference' && byId[obj.id]) {
                    references[obj.id] = await traverse(byId[obj.id], fn, visitedTracker);
                }
            };
            await traverse(docItem, fn, visitedTracker);

            const menuGroup = docItem.tagsByName?.['menu-group'] || 'default';
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
            console.log(path.resolve(packageDir, `${docItem.name}.json`));
            fs.writeFileSync(
                path.resolve(packageDir, `${docItem.name}.json`),
                JSON.stringify(
                    {
                        declaration: docItem,
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
