import Head from 'next/head';
import React from 'react';
import MethodDoc from '../../../api-docs/MethodDoc';
import SignatureDoc from '../../../components/api-docs/SignatureDoc';
import VariableDoc from '../../../components/api-docs/VariableDoc';
import ApiDocHeader from '../../../components/ApiDocHeader';
import Article from '../../../components/Article';
import MainMenuSidebar from '../../../components/MainMenuSidebar';
import Sidebar from '../../../components/Sidebar';
import defaultGetStaticProps, { prepareDocs } from '../../../getStaticProps';

export default function Doc({ docs, extraNodes }) {
    prepareDocs(docs, extraNodes);
    const staticGroups = docs.ViewModelConstructor.groups.reduce((acc, group) => {
        acc[group.title] = group;
        return acc;
    }, {});
    const staticChildren = docs.ViewModelConstructor.children.reduce((acc, child) => {
        acc[child.id] = child;
        return acc;
    }, {});
    const staticMethods = staticGroups.Methods.children
        .map(id => staticChildren[id])
        .filter(method => !method.flags.isPrivate);
    const staticProperties = staticGroups.Properties.children
        .map(id => staticChildren[id])
        .filter(method => !method.flags.isPrivate);
    // There's 2 type definitions here; one the indexable signature which we don't care about and one for the
    // actual interface. Identify interface by existing of children.
    const instanceDef = docs.ViewModelInterface.type.types.filter(t => !!t.declaration.children)[0]
        .declaration;
    const instanceGroups = instanceDef.groups.reduce((acc, group) => {
        acc[group.title] = group;
        return acc;
    }, {});
    const instanceChildren = instanceDef.children.reduce((acc, child) => {
        acc[child.id] = child;
        return acc;
    }, {});
    const instanceMethods = instanceGroups.Functions.children
        .map(id => instanceChildren[id])
        .filter(method => !method.flags.isPrivate);
    const instanceProperties = instanceGroups.Variables.children
        .map(id => instanceChildren[id])
        .filter(method => !method.flags.isPrivate);
    return (
        <>
            <Head>
                <title>Presto - ViewModel</title>
            </Head>
            <MainMenuSidebar />
            <Article>
                <ApiDocHeader
                    doc={{
                        name: 'viewModelFactory',
                        packageName: 'viewmodel',
                        sources: docs.viewModelFactory.sources,
                    }}
                />
                <p className="mdx">
                    A <code>ViewModel</code> class is created using the{' '}
                    <code>viewModelFactory</code> function. The factory function is documented
                    immediately below followed by the documentation for the generated class.
                </p>
                <SignatureDoc
                    signature={
                        docs.viewModelFactory.signatures[
                            docs.viewModelFactory.signatures.length - 1
                        ]
                    }
                    anchorLink="method-viewmodel"
                />
                <h3 className="text-5xl my-5">The ViewModel Class</h3>
                <h3 className="text-4xl">Static Class Methods</h3>
                {staticMethods.map(method => (
                    <MethodDoc key={method.name} method={method} />
                ))}
                <h3 className="text-4xl mt-10">Static Class Properties</h3>
                {staticProperties.map(prop => (
                    <VariableDoc key={prop.name} doc={prop} />
                ))}
                <h3 className="text-4xl mt-10">Instance Methods</h3>
                {instanceMethods.map(method => (
                    <MethodDoc key={method.name} method={method} />
                ))}
                <h3 className="text-4xl mt-10">Instance Properties</h3>
                {instanceProperties.map(prop => (
                    <VariableDoc key={prop.name} doc={prop} />
                ))}
            </Article>
            <Sidebar currentTitle="On This Page">
                <Sidebar.LinksSection
                    title="On this page"
                    links={[
                        {
                            title: 'viewModelFactory',
                            href: `#method-viewmodel`,
                        },
                    ]}
                />
                <h4 className="font-bold text-lg text-gray-600 mb-5">ViewModel</h4>
                <Sidebar.LinksSection
                    title="Static Methods"
                    links={staticMethods.map(prop => ({
                        title: prop.name,
                        href: `#method-${prop.name}`,
                    }))}
                />
                <Sidebar.LinksSection
                    title="Static Properties"
                    links={staticProperties.map(prop => ({
                        title: prop.name,
                        href: `#var-${prop.name}`,
                    }))}
                />
                <Sidebar.LinksSection
                    title="Instance Methods"
                    links={instanceMethods.map(prop => ({
                        title: prop.name,
                        href: `#method-${prop.name}`,
                    }))}
                />
                <Sidebar.LinksSection
                    title="Instance Properties"
                    links={instanceProperties.map(prop => ({
                        title: prop.name,
                        href: `#var-${prop.name}`,
                    }))}
                />
            </Sidebar>
        </>
    );
}

export async function getStaticProps(context) {
    return defaultGetStaticProps(
        context,
        datum =>
            ['viewModelFactory', 'ViewModelInterface', 'ViewModelConstructor'].includes(datum.name),
        items =>
            items.reduce(
                (acc, item) => {
                    acc[item.name] = item;
                    return acc;
                },
                { standalonePage: true }
            )
    );
}
