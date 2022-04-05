import babel from '@babel/core';
import { compile } from '@mdx-js/mdx';
import { DeclarationReflection } from '@prestojs/doc';
import fs from 'fs';
import { createRequire } from 'module';
import path, { dirname } from 'path';

import prettier from 'prettier';
import TypeDoc, { JSONOutput } from 'typedoc';
import { visit } from 'unist-util-visit';
import { fileURLToPath } from 'url';

function getTsFiles(dir): string[] {
    if (dir.endsWith('__tests__')) {
        return [];
    }
    const files: string[] = [];
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

function makeDocLinksPlugin(docsJson) {
    return () => tree => {
        visit(tree, ['link', 'linkReference'], node => {
            if (node.url && node.url.startsWith('doc:')) {
                const [name, hash] = node.url.split(':')[1].split('#');
                const target = docsJson[name];
                if (target) {
                    let url = `/docs/${getSlug(target)}`;
                    if (hash) {
                        url += `#${hash}`;
                    }
                    node.url = url;
                } else {
                    console.warn(`${node.url} does not match the name of any documented item`);
                }
            }
        });
    };
}

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readDirRecursive(dir) {
    const files: string[] = [];
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

const examplesDir = path.resolve(__dirname, '../pages/examples/');
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
    let header = { title: exampleName, description: '' };
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
                })?.code || '',
                { parser: 'babel' }
            ),
            ts: source,
        },
    });
    return acc;
}, {});
const pickedExamples: string[] = [];

async function compileMdx(code, docLinks) {
    try {
        return String(
            await compile(code.trim(), {
                remarkPlugins: [docLinks],
                outputFormat: 'function-body',
                providerImportSource: '@mdx-js/react',
            })
        );
    } catch (e) {
        console.error('Failed to generate code', code, e);
        return null;
    }
}

function getSlug(docItem) {
    const { fileName = '' } = docItem.sources?.[0] || {};
    const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
    return [...importPath.split('/').slice(1, -1), docItem.name].join('/');
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
async function traverse(obj, fn, visitedTracker = new Map(), path: any[] = []) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (visitedTracker.has(obj)) {
        return obj;
    }
    visitedTracker.set(obj, true);
    if (await fn(obj, path)) {
        return obj;
    }
    for (const value of Array.isArray(obj) ? obj : Object.values(obj)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                if (value && typeof value == 'object') {
                    await traverse(v, fn, visitedTracker, [...path, obj]);
                }
            }
        } else if (value && typeof value == 'object') {
            await traverse(value, fn, visitedTracker, [...path, obj]);
        }
    }
    return obj;
}

async function main() {
    const repoRoot = path.resolve(__dirname, '../../');
    const packagesRoot = path.resolve(repoRoot, 'js-packages/@prestojs/');

    for (const pkg of ['viewmodel', 'util']) {
        //['util', 'viewmodel', 'ui', 'final-form', 'ui-antd', 'routing', 'rest']) {
        const app = new TypeDoc.Application();

        app.options.addReader(new TypeDoc.TSConfigReader());
        const entryPoints = getTsFiles(path.join(packagesRoot, pkg, 'src/'));
        app.bootstrap({
            entryPoints,
            tsconfig: path.join(packagesRoot, pkg, 'tsconfig.json'),
            plugin: [
                path.resolve(repoRoot, 'doc-site/plugins/forceExport.js'),
                'typedoc-plugin-rename-defaults',
                path.resolve(repoRoot, 'doc-site/plugins/fixSource.js'),
            ],
            // @ts-ignore
            'presto-root': repoRoot,
            'presto-package-root': path.join(packagesRoot, pkg),
        });

        const project = app.convert();
        if (!project) {
            throw new Error(`convert failed for ${pkg}`);
        }
        const tmpFile = `./___temp_${pkg}.json`;
        await app.generateJson(project, tmpFile);
    }

    const children: JSONOutput.DeclarationReflection[] = [
        ...require('./___temp_util.json').children,
        ...require('./___temp_viewmodel.json').children,
        ...require('./___temp_ui.json').children,
        ...require('./___temp_ui-antd.json').children,
        ...require('./___temp_routing.json').children,
        ...require('./___temp_rest.json').children,
        ...require('./___temp_final-form.json').children,
    ];
    // @ts-ignore
    const declarations: DeclarationReflection[] = [];
    for (const child of children) {
        declarations.push(...(await extractChildren(child)));
    }
    const docsPath = path.resolve(__dirname, '../data/');

    const byId = {};
    const byName = {};
    const menuByName: Record<string, any> = {};
    for (const docItem of declarations) {
        byId[docItem.id] = docItem;
        byName[docItem.name] = docItem;
    }
    const docLinks = makeDocLinksPlugin(byName);
    const visitedTracker = new Map();
    function getName(obj) {
        if (obj.name === 'default' && obj.type === 'reference' && byId[obj.id]) {
            return getName(byId[obj.id]);
        }
        return obj.name;
    }
    for (const docItem of declarations) {
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
        const fn = async (obj, path) => {
            if (obj.type === 'reference' && !obj.id) {
                if (byName[obj.name]) {
                    obj.id = byName[obj.name].id;
                }
            }
            if (obj.name === 'default' && obj.type === 'reference' && byId[obj.id]) {
                obj.name = getName(obj);
            }
            let { comment, signatures, kindString } = obj;
            if (obj.name === '__namedParameters') {
                obj.name = 'props';
                if (!obj.docFlags) {
                    obj.docFlags = {};
                }
                obj.docFlags.expandProperties = true;
            }
            if (obj.name === '__type' && path.length) {
                // This is where parameter like:
                // isEquals: (a, b) => boolean
                // The function def will get __type as the name so when we render it
                // in modal it looks bad. Render is as isEquals instead
                for (let i = path.length - 1; i >= 0; i--) {
                    if (path[i].name && path[i].name !== obj.name) {
                        obj.name = path[i].name;
                        break;
                    }
                }
            }
            const getGroup = () => {
                const groups = path[path.length - 1]?.groups || [];
                return groups.find(group => group.children.includes(obj.id));
            };
            if (signatures) {
                const group = getGroup();
                signatures.forEach((signature, i) => {
                    if (!comment && signature.comment) {
                        comment = signature.comment;
                    }
                    let anchorId = signature.name.replace(' ', '-');
                    if (group) {
                        anchorId = `${group.title}-${anchorId}`;
                    }
                    if (i > 0) {
                        anchorId += `-${i}`;
                    }
                    signature.anchorId = anchorId;
                });
            } else if (obj.id && obj.flags) {
                const group = getGroup();
                let anchorId = obj.name.split(' ').join('-');
                if (group) {
                    anchorId = `${group.title}-${anchorId}`;
                } else if (obj.kindString) {
                    anchorId = `${obj.kindString.split(' ').join('-')}-${anchorId}`;
                }
                obj.anchorId = anchorId;
            }
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
            if (comment && !obj?.flags.isExternal) {
                if (comment.shortText) {
                    comment.shortTextMdx = await compileMdx(comment.shortText, docLinks);
                }
                if (comment.text) {
                    comment.textMdx = await compileMdx(comment.text, docLinks);
                }
                if (comment.returns) {
                    comment.returnsMdx = await compileMdx(comment.returns, docLinks);
                }
                if (comment.tags) {
                    for (const tag of comment.tags) {
                        const text = tag.text.trim();
                        if (tag.tag === 'deprecated') {
                            obj.docFlags.deprecated = text
                                ? await compileMdx(text, docLinks)
                                : true;
                        }
                        if (tag.tag === 'expand-properties') {
                            obj.docFlags.expandProperties = true;
                        }
                        if (tag.tag === 'forward-ref') {
                            obj.docFlags.isForwardRef = true;
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
        const referenceVisitedTracker = new Map();
        await traverse(
            docItem,
            async obj => {
                if (obj.type === 'reference' && byId[obj.id]) {
                    references[obj.id] = await traverse(byId[obj.id], fn, referenceVisitedTracker);
                }
            },
            referenceVisitedTracker
        );
        if (docItem.comment) {
            type Section = { title: string; links: { id: string; title: string }[] };
            const inPageLinks: Section[] = [];
            let section: null | Section = null;
            for (const attr of ['shortText', 'text']) {
                const value = docItem.comment[attr];
                if (value && docItem.comment[attr + 'Mdx']) {
                    const matches = value
                        .split('\n')
                        .map(line => line.match(/^(#+) (.*)$/))
                        .filter(Boolean);
                    if (matches.length > 0) {
                        for (const [, hashes, title] of matches) {
                            const heading = `h${hashes.length}`;
                            if (heading !== 'h2' && heading !== 'h3') {
                                throw new Error(`Dunno how to handle ${heading} - update logic`);
                            }
                            if (heading === 'h2') {
                                if (section) {
                                    inPageLinks.push(section);
                                }
                                section = {
                                    title,
                                    links: [],
                                };
                            }
                            if (heading === 'h3') {
                                if (!section) {
                                    section = {
                                        title: docItem.name,
                                        links: [],
                                    };
                                }
                                section.links.push({
                                    title: title,
                                    id: title.split(' ').join('-'),
                                });
                            }
                        }
                    }
                }
            }
            if (section) {
                inPageLinks.push(section);
            }
            if (inPageLinks.length > 0) {
                docItem.inPageLinks = inPageLinks;
            }
        }

        const menuGroup = docItem.tagsByName?.['menu-group'] || 'default';
        const { fileName = '' } = docItem.sources?.[0] || {};
        const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
        const slug = [...importPath.split('/').slice(1, -1), docItem.name].join('/');
        docItem.slug = slug;
        const permaLink = slug.split('/').slice(1).join('/');
        const [packageName] = slug.split('/');
        const packageDir = `${docsPath}/${packageName}`;
        const outPath = path.resolve(packageDir, `${slug.split('/').slice(1).join('/')}.json`);
        const exampleKey = importPath.replace('@prestojs/', '');
        const examples = exampleFiles[exampleKey];
        if (examples) {
            await Promise.all(
                examples.map(async example => {
                    if (example.header.description) {
                        example.header.description = await compileMdx(
                            example.header.description,
                            docLinks
                        );
                    }
                })
            );
            pickedExamples.push(exampleKey);
        }

        if (!fs.existsSync(path.dirname(outPath))) {
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
        }
        fs.writeFileSync(
            outPath,
            JSON.stringify(
                {
                    declaration: docItem,
                    references,
                    meta: {
                        packageName,
                        permaLink,
                        menuGroup,
                        examples,
                    },
                },
                null,
                2
            )
        );

        menuByName[packageName] = menuByName[packageName] || {};
        menuByName[packageName][menuGroup] = menuByName[packageName][menuGroup] || [];
        menuByName[packageName][menuGroup].push({
            title: docItem.name,
            slug,
        });
    }
    const apiMenu = {};
    for (const [menuName, menu] of Object.entries(menuByName)) {
        const sections: [string, any][] = Object.entries(menu);
        sections.sort((a, b) => {
            if (a[0] === 'default') {
                return -1;
            }
            if (b[0] === 'default') {
                return 1;
            }
            return a[0].localeCompare(b[0]);
        });
        const sortedMenu: { items: any; isDefault?: boolean; title?: string }[] = [];
        for (const [sectionName, _items] of sections) {
            _items.sort((a, b) => {
                return a.title.localeCompare(b.title);
            });
            const items = _items.map(item => ({ title: item.title, href: `/docs/${item.slug}` }));
            if (sectionName === 'default') {
                sortedMenu.push({ items, isDefault: true });
            } else {
                sortedMenu.push({ items, title: sectionName });
            }
        }
        apiMenu[menuName] = sortedMenu;
    }
    fs.writeFileSync(path.resolve(docsPath, `apiMenu.json`), JSON.stringify(apiMenu, null, 2));
    const missedExamples = Object.keys(exampleFiles).filter(key => !pickedExamples.includes(key));
    if (missedExamples.length > 0) {
        console.error(`There are example files that were not matched to a source file:
    
${missedExamples.join('\n')}
    `);
    }
}

main();
