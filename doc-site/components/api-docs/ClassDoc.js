import React from 'react';
import { getSignatureId } from '../../api-docs/MethodDoc';
import { getClassDetails, getTypeArguments, transformParameters } from '../../util';
import ApiDocHeader from '../ApiDocHeader';
import Article from '../Article';
import Sidebar from '../Sidebar';
import TypeArgProvider from '../TypeArgProvider';
import ClassDetails from './ClassDetails';
import SignatureDefinition from './SignatureDefinition';

export default function ClassDoc({ doc, baseUrl }) {
    const classDetails = getClassDetails(doc);
    const { constructor, methods, properties, staticMethods, staticProperties } = classDetails;
    const typeArguments = getTypeArguments(doc);
    let sideLinkIds = [];
    if (doc.mdx) {
        const matches = doc.mdx.match(/data-anchorlink="([^"]*)"/g);
        if (matches) {
            sideLinkIds = matches.map(m => m.split('"')[1]);
        }
    }
    return (
        <TypeArgProvider typeArguments={typeArguments}>
            <Article>
                <ApiDocHeader doc={doc} isType={doc.kindString === 'Interface'} />
                {doc.mdx && <div className="mb-20" dangerouslySetInnerHTML={{ __html: doc.mdx }} />}
                <h2 className="text-4xl my-10 text-gray-700 border-b-2">API</h2>
                <ClassDetails {...classDetails} />
            </Article>
            <Sidebar currentTitle="On This Page" id="secondary-nav">
                {sideLinkIds.length > 0 && (
                    <Sidebar.LinksSection
                        links={sideLinkIds.map(linkId => ({
                            href: `${baseUrl}#${linkId}`,
                            title: linkId.split('_').join(' '),
                        }))}
                    />
                )}
                {constructor && (
                    <Sidebar.LinksSection
                        title="Constructor"
                        links={[{ href: '#constructor', title: constructor.signatures[0].name }]}
                    />
                )}
                {methods.direct.length > 0 && (
                    <Sidebar.LinksSection
                        title="Methods"
                        links={methods.direct.reduce((acc, method) => {
                            method.signatures.forEach(sig => {
                                acc.push({
                                    href: `${baseUrl}#${getSignatureId(method, sig)}`,
                                    title: (
                                        <SignatureDefinition
                                            name={sig.name}
                                            parameters={(sig.parameters || []).map(
                                                transformParameters
                                            )}
                                        />
                                    ),
                                });
                            });
                            return acc;
                        }, [])}
                    />
                )}
                {staticMethods.direct.length > 0 && (
                    <Sidebar.LinksSection
                        title="Static Methods"
                        links={staticMethods.direct.reduce((acc, method) => {
                            method.signatures.forEach(sig => {
                                acc.push({
                                    href: `${baseUrl}#${getSignatureId(
                                        method,
                                        sig,
                                        'static-method'
                                    )}`,
                                    title: (
                                        <SignatureDefinition
                                            name={sig.name}
                                            parameters={(sig.parameters || []).map(
                                                transformParameters
                                            )}
                                        />
                                    ),
                                });
                            });
                            return acc;
                        }, [])}
                    />
                )}
                {properties.direct.length > 0 && (
                    <Sidebar.LinksSection
                        title="Properties"
                        links={properties.direct.map(prop => ({
                            href: `${baseUrl}#var-${prop.name}`,
                            title: prop.name,
                        }))}
                    />
                )}
                {staticProperties.direct.length > 0 && (
                    <Sidebar.LinksSection
                        title="Static Properties"
                        links={staticProperties.direct.map(prop => ({
                            href: `${baseUrl}#static-var-${prop.name}`,
                            title: prop.name,
                        }))}
                    />
                )}
                {methods.inherited.length > 0 && (
                    <Sidebar.LinksSection
                        title="Inherited Methods"
                        links={methods.inherited.map(method => ({
                            href: `${baseUrl}#inh-method-${method.name}`,
                            title: (
                                <SignatureDefinition
                                    name={method.name}
                                    parameters={(method.parameters || []).map(transformParameters)}
                                />
                            ),
                        }))}
                    />
                )}
                {staticMethods.inherited.length > 0 && (
                    <Sidebar.LinksSection
                        title="Inherited Static Methods"
                        links={staticMethods.inherited.map(method => ({
                            href: `${baseUrl}#static-inh-method-${method.name}`,
                            title: (
                                <SignatureDefinition
                                    name={method.name}
                                    parameters={(method.parameters || []).map(transformParameters)}
                                />
                            ),
                        }))}
                    />
                )}
                {properties.inherited.length > 0 && (
                    <Sidebar.LinksSection
                        title="Inherited Properties"
                        links={properties.inherited.map(prop => ({
                            href: `${baseUrl}#inh-var-${prop.name}`,
                            title: prop.name,
                        }))}
                    />
                )}
                {staticProperties.inherited.length > 0 && (
                    <Sidebar.LinksSection
                        title="Inherited Static Properties"
                        links={staticProperties.inherited.map(prop => ({
                            href: `${baseUrl}#static-inh-var-${prop.name}`,
                            title: prop.name,
                        }))}
                    />
                )}
            </Sidebar>
        </TypeArgProvider>
    );
}
