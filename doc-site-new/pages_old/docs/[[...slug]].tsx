import fs from 'fs';
import Head from 'next/head';
import path from 'path';
import React from 'react';

export default function Doc({ docs, extraNodes, slug }) {
    console.log(docs, extraNodes, slug);
    return (
        <>
            <Head>
                <title>Presto - </title>
            </Head>
        </>
    );
}

async function defaultGetStaticProps(
    context,
    filter,
    transform = id => id
    // remarkPlugins = [docLinks]
) {
    const fn = path.join(process.cwd(), 'data/typeDocs.json');
    const data = JSON.parse(fs.readFileSync(fn, 'utf-8'));
    const byId = data.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
    }, {});
    const items = data.filter(filter);
    const extraNodes = {};
    // // async function transformComment(obj) {
    // //     if (obj.comment && (obj.comment.shortText || obj.comment.text)) {
    // //         if (/```.*live/.test(obj.comment.text || '')) {
    // //             obj.mdx = {
    // //                 live: true,
    // //                 ...obj.comment,
    // //             };
    // //         } else {
    // //             let short = null;
    // //             let long = null;
    // //             if (obj.comment.shortText) {
    // //                 short = await transformMdx(obj.comment.shortText.trim(), remarkPlugins, {
    // //                     components: mdxComponents,
    // //                 });
    // //             }
    // //             if (obj.comment.text) {
    // //                 long = await transformMdx(obj.comment.text.trim(), remarkPlugins, {
    // //                     components: mdxComponents,
    // //                 });
    // //             }
    // //             obj.mdx = ReactDOMServer.renderToStaticMarkup(
    // //                 <div className="mdx">
    // //                     {short}
    // //                     {long}
    // //                 </div>
    // //             );
    // //         }
    // //     }
    // //     if (obj.comment && obj.comment.returns) {
    // //         obj.mdxReturns = ReactDOMServer.renderToStaticMarkup(
    // //             <div className="mdx">
    // //                 {
    // //                     await transformMdx(obj.comment.returns.trim(), remarkPlugins, {
    // //                         components: mdxComponents,
    // //                     })
    // //                 }
    // //             </div>
    // //         );
    // //     }
    // //     if (obj.examples) {
    // //         for (const example of obj.examples) {
    // //             if (example.header.description) {
    // //                 example.header.description = ReactDOMServer.renderToStaticMarkup(
    // //                     <div className="mdx">
    // //                         {
    // //                             await transformMdx(
    // //                                 example.header.description.trim(),
    // //                                 remarkPlugins,
    // //                                 {
    // //                                     components: mdxComponents,
    // //                                 }
    // //                             )
    // //                         }
    // //                     </div>
    // //                 );
    // //             }
    // //         }
    // //     }
    // // }
    // const visitedTracker = new Map();
    // async function transformObj(obj) {
    //     await transformComment(obj);
    //     if (obj.type === 'reference' && !extraNodes[obj.id] && obj.id && byId[obj.id]) {
    //         extraNodes[obj.id] = byId[obj.id];
    //         await traverse(byId[obj.id], transformObj, visitedTracker);
    //     }
    // }
    // const docs = [];
    // for (const item of items) {
    //     docs.push(await traverse(item, transformObj, visitedTracker));
    // }
    return {
        props: {
            docs: transform(items),
            extraNodes,
            slug: context.params?.slug.join('/') || null,
        }, // will be passed to the page component as props
    };
}

export async function getStaticProps(context) {
    const slug = context.params.slug.join('/');
    // const remarkPlugins = [docLinks, codesandbox];
    return defaultGetStaticProps(
        context,
        datum => datum.extractDocs && datum.slug === slug,
        id => id
        // remarkPlugins
    );
}

export function getStaticPaths() {
    const fn = path.join(process.cwd(), 'data/typeDocs.json');
    const data = JSON.parse(fs.readFileSync(fn, 'utf-8'));
    const paths: { params: { slug: string[] } }[] = [];
    for (const datum of data) {
        if (datum.extractDocs) {
            paths.push({
                params: {
                    slug: datum.slug.split('/').filter(Boolean),
                },
            });
        }
    }
    return {
        paths,
        fallback: false,
    };
}
