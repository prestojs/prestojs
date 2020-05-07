import { MDXProvider } from '@mdx-js/react';
import MDX from '@mdx-js/runtime';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import mdxComponents from './components/mdxComponents';

const VISITED = Symbol.for('VISITED');

function traverse(obj, fn) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (obj[VISITED]) {
        return obj;
    }

    obj[VISITED] = true;
    if (fn(obj)) {
        return obj;
    }
    for (const value of Object.values(obj)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                if (value && typeof value == 'object') {
                    traverse(v, fn);
                }
            }
        } else if (value && typeof value == 'object') {
            traverse(value, fn);
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
    traverse(docs, fn);
    traverse(extraNodes, fn);
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
                let href = `/docs/${target.slug}/`;
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
    function transformObj(obj) {
        transformComment(obj);
        if (obj.type === 'reference' && !extraNodes[obj.id] && obj.id && byId[obj.id]) {
            extraNodes[obj.id] = byId[obj.id];
            traverse(byId[obj.id], transformObj);
        }
    }
    const docs = transform(items.map(item => traverse(item, transformObj)));
    return {
        props: {
            docs,
            extraNodes,
        }, // will be passed to the page component as props
    };
}
