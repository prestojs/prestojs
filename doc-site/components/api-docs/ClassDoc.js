import React from 'react';
import MethodDoc, { getSignatureId } from '../../api-docs/MethodDoc';
import AnchorLink from '../AnchorLink';
import ApiDocHeader from '../ApiDocHeader';
import Article from '../Article';
import Sidebar from '../Sidebar';
import TypeArgProvider from '../TypeArgProvider';
import SignatureDefinition from './SignatureDefinition';
import SignatureDoc from './SignatureDoc';

function transformParameters(p) {
    return {
        ...p,
        // Don't show __namedParameters which is just a spread element extracted by typedoc
        name: p.name === '__namedParameters' ? 'params' : p.name,
    };
}

function getTypeArguments(doc) {
    const types = {};
    for (const t of doc.extendedTypes || []) {
        const type = t.referencedType?.() || t;
        if (type.extendedTypes) {
            Object.assign(types, getTypeArguments(type));
        }
        if (t.typeArguments) {
            const x = t.typeArguments.reduce((acc, item, i) => {
                acc[type.typeParameter[i].name] = item.name;
                return acc;
            }, {});
            Object.assign(types, x);
        }
    }
    return types;
}

export default function ClassDoc({ doc }) {
    const typeArguments = getTypeArguments(doc);
    const groups = doc.groups.reduce((acc, group) => {
        acc[group.title] = group;
        return acc;
    }, {});
    const children = doc.children.reduce((acc, child) => {
        acc[child.id] = child;
        return acc;
    }, {});
    const constructor = groups.Constructors && children[groups.Constructors.children[0]];
    const methods =
        (groups.Methods &&
            groups.Methods.children
                .map(id => children[id])
                .filter(method => !method.flags.isPrivate)) ||
        [];
    const direct = [];
    const inherited = [];
    for (const method of methods) {
        if (method.signatures[0].inheritedFrom) {
            inherited.push(method);
        } else {
            direct.push(method);
        }
    }
    return (
        <TypeArgProvider typeArguments={typeArguments}>
            <Article>
                <ApiDocHeader doc={doc} />
                {doc.mdx && <div className="mb-20" dangerouslySetInnerHTML={{ __html: doc.mdx }} />}
                {constructor && (
                    <>
                        <AnchorLink id="constructor" Component="h3" className="text-4xl">
                            Constructor
                        </AnchorLink>
                        {constructor.signatures.map((sig, i) => (
                            <SignatureDoc
                                key={i}
                                signature={sig}
                                method={constructor}
                                isConstructor
                            />
                        ))}
                    </>
                )}
                {methods.length > 0 && (
                    <>
                        {direct.length > 0 && (
                            <>
                                <h3 className="text-4xl">Methods</h3>
                                {direct.map(method => (
                                    <MethodDoc key={method.name} method={method} />
                                ))}
                            </>
                        )}
                        {inherited.length > 0 && (
                            <>
                                <h3 className="text-4xl mt-10">Inherited Methods</h3>
                                {inherited.map(method => (
                                    <MethodDoc key={method.name} method={method} />
                                ))}
                            </>
                        )}
                    </>
                )}
            </Article>
            <Sidebar currentTitle="On This Page">
                {constructor && (
                    <Sidebar.LinksSection
                        title="Constructor"
                        links={[{ href: '#constructor', title: constructor.signatures[0].name }]}
                    />
                )}
                {direct.length > 0 && (
                    <Sidebar.LinksSection
                        title="Methods"
                        links={direct.reduce((acc, method) => {
                            method.signatures.forEach(sig => {
                                acc.push({
                                    href: `#${getSignatureId(method, sig)}`,
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
                {inherited.length > 0 && (
                    <Sidebar.LinksSection
                        title="Inherited Methods"
                        links={inherited.map(method => ({
                            href: `#method-${method.name}`,
                            title: (
                                <SignatureDefinition
                                    name={method.name}
                                    parameters={(method.parameters || []).map(transformParameters)}
                                />
                            ),
                        }))}
                    />
                )}
            </Sidebar>
        </TypeArgProvider>
    );
}
