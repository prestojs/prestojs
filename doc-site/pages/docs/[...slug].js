import fs from 'fs';
import Head from 'next/head';
import path from 'path';
import React from 'react';
import defaultGetStaticProps, { prepareDocs } from '../../getStaticProps';
import ClassDoc from '../../components/api-docs/ClassDoc';
import FunctionDoc from '../../components/api-docs/FunctionDoc';
import VariableDoc from '../../components/api-docs/VariableDoc';
import MainMenuSidebar from '../../components/MainMenuSidebar';

const kindComponents = {
    Function: FunctionDoc,
    Class: ClassDoc,
    Variable: VariableDoc,
};

export default function Doc({ docs, extraNodes }) {
    prepareDocs(docs, extraNodes);
    const doc = docs[0];
    const DocComponent = kindComponents[doc.kindString];
    return (
        <>
            <Head>
                <title>Presto - {doc.name}</title>
            </Head>
            <MainMenuSidebar />
            <DocComponent doc={doc} />
        </>
    );
}

export async function getStaticProps(context) {
    const slug = context.params.slug.join('/');
    console.log(slug);
    return defaultGetStaticProps(context, datum => datum.slug === slug);
}

export function getStaticPaths() {
    const fn = path.join(process.cwd(), 'data/typeDocs.json');
    const data = JSON.parse(fs.readFileSync(fn, 'utf-8'));
    const paths = [];
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
