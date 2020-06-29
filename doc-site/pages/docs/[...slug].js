import fs from 'fs';
import Head from 'next/head';
import path from 'path';
import React from 'react';
import ClassDoc from '../../components/api-docs/ClassDoc';
import FunctionDoc from '../../components/api-docs/FunctionDoc';
import UnionInterface from '../../components/api-docs/UnionInterface';
import VariableDoc from '../../components/api-docs/VariableDoc';
import MainMenuSidebar from '../../components/MainMenuSidebar';
import defaultGetStaticProps, { prepareDocs } from '../../getStaticProps';

const kindComponents = {
    Function: FunctionDoc,
    Class: ClassDoc,
    Variable: VariableDoc,
    UnionInterface,
    Interface: ClassDoc,
};

export default function Doc({ docs, extraNodes }) {
    if (docs.standalonePage) {
        // In dev you end up here instead of in viewModelFactory.js but only when you
        // navigate to the page via frontend routing. Refresh page to make it work.
        window.location.reload();
        return null;
    }
    prepareDocs(docs, extraNodes);
    const doc = docs[0];
    const DocComponent = kindComponents[doc.docClass || doc.kindString];
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
    return defaultGetStaticProps(context, datum => datum.extractDocs && datum.slug === slug);
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
