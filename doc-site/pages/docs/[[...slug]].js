import fs from 'fs';
import Head from 'next/head';
import path from 'path';
import React from 'react';
import ClassDoc from '../../components/api-docs/ClassDoc';
import FunctionDoc from '../../components/api-docs/FunctionDoc';
import UnionInterface from '../../components/api-docs/UnionInterface';
import VariableDoc from '../../components/api-docs/VariableDoc';
import MainMenuSidebar from '../../components/MainMenuSidebar';
import defaultGetStaticProps, { usePrepareDocs } from '../../getStaticProps';
import codesandbox from '../../remark-plugins/codesandbox';
import docLinks from '../../remark-plugins/docLinks';
import ViewModelFactoryDoc from './viewmodel/viewModelFactory';

const kindComponents = {
    Function: FunctionDoc,
    Class: ClassDoc,
    Variable: VariableDoc,
    UnionInterface,
    Interface: ClassDoc,
};

export default function Doc({ docs, extraNodes, slug }) {
    usePrepareDocs(docs, extraNodes);
    if (docs.viewModelFactory) {
        // For some reason in production this component ([[...slug.js]]) is rendered
        // instead of ViewModelFactoryDoc
        return <ViewModelFactoryDoc {...{ docs, extraNodes, slug }} />;
    }
    const doc = docs[0];
    const DocComponent = kindComponents[doc.docClass || doc.kindString];
    return (
        <>
            <Head>
                <title>Presto - {doc.name}</title>
            </Head>
            <MainMenuSidebar />
            <DocComponent doc={doc} baseUrl={`/docs/${slug}`} />
        </>
    );
}

export async function getStaticProps(context) {
    const slug = context.params.slug.join('/');
    const remarkPlugins = [docLinks, codesandbox];
    return defaultGetStaticProps(
        context,
        datum => datum.extractDocs && datum.slug === slug,
        id => id,
        remarkPlugins
    );
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
