import mdx from '@mdx-js/mdx';
import { mdx as createElement, MDXProvider } from '@mdx-js/react';
import { transform } from 'buble-jsx-only';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import mdxComponents from './components/mdxComponents';
import docLinks from './remark-plugins/docLinks';

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
    for (const value of Object.values(obj)) {
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

async function transformMdx(contents, remarkPlugins, { scope = {}, components = {}, props }) {
    const fullScope = {
        mdx: createElement,
        MDXProvider,
        components,
        props,
        ...scope,
    };
    const jsx = await mdx(contents, {
        remarkPlugins,
        skipExport: true,
        blah: true,
    });
    let code;
    try {
        code = transform(jsx, {
            objectAssign: 'Object.assign',
        }).code;
    } catch (err) {
        console.error(err);
        throw err;
    }

    const keys = Object.keys(fullScope);
    const values = Object.values(fullScope);
    // eslint-disable-next-line no-new-func
    const fn = new Function(
        '_fn',
        'React',
        ...keys,
        `${code}
    return React.createElement(MDXProvider, { components },
      React.createElement(MDXContent, props)
    );`
    );

    return fn({}, React, ...values);
}

async function prepareDocs(docs, extraNodes) {
    const fn = obj => {
        if (obj.type === 'reference' && extraNodes[obj.id]) {
            obj.referencedType = () => extraNodes[obj.id];
        }
    };
    const visitedTracker = new Map();
    await traverse(docs, fn, visitedTracker);
    await traverse(extraNodes, fn, visitedTracker);
}

/**
 * Returns true once prepareDocs has finished running. Necessary as it is async.
 */
export function usePrepareDocs(docs, extraNodes) {
    const [loaded, setLoaded] = React.useState(false);
    React.useEffect(() => {
        let isCurrent = true;
        async function run() {
            await prepareDocs(docs, extraNodes);
            if (isCurrent) {
                setLoaded(true);
            }
        }

        run();

        return () => {
            isCurrent = false;
        };
    }, [docs, extraNodes]);

    return loaded;
}

export default async function getStaticProps(
    context,
    filter,
    transform = id => id,
    remarkPlugins = [docLinks]
) {
    const fn = path.join(process.cwd(), 'data/typeDocs.json');
    const data = JSON.parse(fs.readFileSync(fn, 'utf-8'));
    const byId = data.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
    }, {});
    const items = data.filter(filter);
    const extraNodes = {};
    async function transformComment(obj) {
        if (obj.comment && (obj.comment.shortText || obj.comment.text)) {
            if (/```.*live/.test(obj.comment.text || '')) {
                obj.mdx = {
                    live: true,
                    ...obj.comment,
                };
            } else {
                let short = null;
                let long = null;
                if (obj.comment.shortText) {
                    short = await transformMdx(obj.comment.shortText.trim(), remarkPlugins, {
                        components: mdxComponents,
                    });
                }
                if (obj.comment.text) {
                    long = await transformMdx(obj.comment.text.trim(), remarkPlugins, {
                        components: mdxComponents,
                    });
                }
                obj.mdx = ReactDOMServer.renderToStaticMarkup(
                    <div className="mdx">
                        {short}
                        {long}
                    </div>
                );
            }
        }
        if (obj.comment && obj.comment.returns) {
            obj.mdxReturns = ReactDOMServer.renderToStaticMarkup(
                <div className="mdx">
                    {
                        await transformMdx(obj.comment.returns.trim(), remarkPlugins, {
                            components: mdxComponents,
                        })
                    }
                </div>
            );
        }
    }
    const visitedTracker = new Map();
    async function transformObj(obj) {
        await transformComment(obj);
        if (obj.type === 'reference' && !extraNodes[obj.id] && obj.id && byId[obj.id]) {
            extraNodes[obj.id] = byId[obj.id];
            traverse(byId[obj.id], transformObj, visitedTracker);
        }
    }
    const docs = [];
    for (const item of items) {
        docs.push(await traverse(item, transformObj, visitedTracker));
    }
    return {
        props: {
            docs: transform(docs),
            extraNodes,
            slug: context.params?.slug.join('/') || null,
        }, // will be passed to the page component as props
    };
}
