import { MDXProvider } from '@mdx-js/react';
import MDX from '@mdx-js/runtime';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import mdxComponents from './components/mdxComponents';

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

export function prepareDocs(docs, extraNodes) {
    const fn = obj => {
        if (obj.type === 'reference' && extraNodes[obj.id]) {
            obj.referencedType = () => extraNodes[obj.id];
        }
    };
    const visitedTracker = new Map();
    traverse(docs, fn, visitedTracker);
    traverse(extraNodes, fn, visitedTracker);
}

export default function getStaticProps(context, filter, transform = id => id) {
    const fn = path.join(process.cwd(), 'data/typeDocs.json');
    const data = JSON.parse(fs.readFileSync(fn, 'utf-8'));
    const byId = data.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
    }, {});
    const items = data.filter(filter);
    const extraNodes = {};
    function LinkWrapper(props) {
        if (props.href.startsWith('doc:')) {
            const [name, hash] = props.href.split(':')[1].split('#');
            const target = data.filter(datum => datum.name === name)[0];
            if (target) {
                let href = `/docs/${target.slug}`;
                if (hash) {
                    href += `#${hash}`;
                }
                return <a {...props} href={href} />;
            }
        }
        return <a {...props} />;
    }
    function transformComment(obj) {
        if (obj.comment && (obj.comment.shortText || obj.comment.text)) {
            if (/```.*live/.test(obj.comment.text || '')) {
                obj.mdx = {
                    live: true,
                    ...obj.comment,
                };
            } else {
                obj.mdx = ReactDOMServer.renderToStaticMarkup(
                    <MDXProvider components={{ ...mdxComponents, a: LinkWrapper }}>
                        <div className="mdx">
                            {obj.comment.shortText && <MDX>{obj.comment.shortText.trim()}</MDX>}
                            {obj.comment.text && <MDX>{obj.comment.text.trim()}</MDX>}
                        </div>
                    </MDXProvider>
                );
            }
        }
        if (obj.comment && obj.comment.returns) {
            obj.mdxReturns = ReactDOMServer.renderToStaticMarkup(
                <MDXProvider components={{ ...mdxComponents, a: LinkWrapper }}>
                    <div className="mdx">
                        <MDX>{obj.comment.returns.trim()}</MDX>
                    </div>
                </MDXProvider>
            );
        }
    }
    const visitedTracker = new Map();
    function transformObj(obj) {
        transformComment(obj);
        if (obj.type === 'reference' && !extraNodes[obj.id] && obj.id && byId[obj.id]) {
            extraNodes[obj.id] = byId[obj.id];
            traverse(byId[obj.id], transformObj, visitedTracker);
        }
    }
    const docs = transform(items.map(item => traverse(item, transformObj, visitedTracker)));
    return {
        props: {
            docs,
            extraNodes,
            slug: context.params?.slug.join('/') || null,
        }, // will be passed to the page component as props
    };
}
