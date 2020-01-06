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
    if (comment && comment.tags && comment.tags) {
        extractDocs = comment.tags.filter(tag => tag.tag === 'extract-docs').length > 0;
    }
    rest.extractDocs = extractDocs;
    if (extractDocs) {
        const { fileName } = rest.sources[0];
        const slug = fileName
            .replace('js-packages/', '')
            .replace('src/', '')
            .split('.')[0];
        const permaLink = `/api/${slug}.html`;
        const [, packageName, ...names] = slug.split('/');
        rest.slug = permaLink;
        rest.packageName = packageName;

        // const name = names.pop();
        // const extra = names;
        //         const text = comment.text;
        //         if (text) {
        //             let dir = `./doc-site/data/${packageName}/`;
        //             if (extra.length > 0) {
        //                 dir += `${extra.join('/')}/`;
        //             }
        //             if (!fs.existsSync(dir)) {
        //                 fs.mkdirSync(dir, { recursive: true });
        //             }
        //             const contents = `---
        // id: ${String(rest.id)}
        // title: ${name}
        // slug: ${permaLink}
        // ---
        //
        // ${text}
        // `;
        //             fs.writeFileSync(`${dir}${name}.mdx`, contents);
        //         }
    }
    if (children) {
        rest.childIds = children.map(child => child.id);
    }
    rest.children = rest.childNodes = children;
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
    './data/typeDocs.json',
    JSON.stringify(
        transformedData.reduce((acc, child) => {
            acc.push(...extractChildren(child));
            return acc;
        }, []),
        null,
        2
    )
);
