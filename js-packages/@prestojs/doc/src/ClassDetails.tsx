import { OnThisPageSection, useOnThisPageSections } from '@prestojs/doc/OnThisPageProvider';
import React, { useEffect } from 'react';
import { JSONOutput } from 'typedoc';
import AnchorLink, { generateId } from './AnchorLink';
import SignatureDoc from './SignatureDoc';
import Variable from './Variable';

function MethodDoc({ method }) {
    return (
        <div className="py-2">
            {method.signatures.map((sig, i) => (
                <SignatureDoc key={i} signature={sig} />
            ))}
        </div>
    );
}

function SectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
    return (
        <AnchorLink
            component="h3"
            id={id || generateId(children)}
            className="group flex whitespace-pre-wrap text-md text-cyan-500 font-semibold"
        >
            {children}
        </AnchorLink>
    );
}

export default function ClassDetails({
    classDetails,
}: {
    classDetails: {
        constructor?: JSONOutput.DeclarationReflection;
        methods: JSONOutput.DeclarationReflection[];
        properties: JSONOutput.DeclarationReflection[];
        staticMethods: JSONOutput.DeclarationReflection[];
        staticProperties: JSONOutput.DeclarationReflection[];
    };
}) {
    const { addSections } = useOnThisPageSections();
    useEffect(() => {
        const sections: OnThisPageSection[] = [];
        if (classDetails.constructor?.signatures) {
            sections.push({
                title: 'Constructor',
                links: [
                    {
                        title: classDetails.constructor.signatures[0].name,
                        id: classDetails.constructor.signatures[0].anchorId,
                    },
                ],
            });
        }
        if (classDetails.methods.length) {
            sections.push({
                title: 'Methods',
                links: classDetails.methods.map(method => ({
                    id: method.signatures?.[0].anchorId || method.anchorId,
                    title: method.name,
                })),
            });
        }
        if (classDetails.staticMethods.length) {
            sections.push({
                title: 'Static Methods',
                links: classDetails.methods.map(method => ({
                    id: method.signatures?.[0].anchorId || method.anchorId,
                    title: method.name,
                })),
            });
        }
        if (classDetails.properties.length) {
            sections.push({
                title: 'Properties',
                links: classDetails.properties.map(method => ({
                    id: method.signatures?.[0].anchorId || method.anchorId,
                    title: method.name,
                })),
            });
        }
        if (classDetails.staticProperties.length) {
            sections.push({
                title: 'Static Properties',
                links: classDetails.staticProperties.map(method => ({
                    id: method.signatures?.[0].anchorId || method.anchorId,
                    title: method.name,
                })),
            });
        }
        return addSections(sections);
    }, [classDetails]);
    const { constructor, methods, staticMethods, staticProperties, properties } = classDetails;
    return (
        <>
            {constructor && (
                <>
                    <SectionHeading>Constructor</SectionHeading>
                    {constructor.signatures?.map((sig, i) => (
                        <SignatureDoc key={i} signature={sig} hideTypeParameters />
                    ))}
                </>
            )}
            {methods.length > 0 && (
                <>
                    <SectionHeading>Methods</SectionHeading>
                    {methods.map(method => (
                        <MethodDoc key={method.name} method={method} />
                    ))}
                </>
            )}
            {staticMethods.length > 0 && (
                <>
                    <SectionHeading>Static Methods</SectionHeading>
                    {staticMethods.map(method => (
                        <MethodDoc key={method.name} method={method} />
                    ))}
                </>
            )}
            {properties.length > 0 && (
                <>
                    <SectionHeading>Properties</SectionHeading>
                    {properties.map(prop => (
                        <Variable key={prop.name} variable={prop} />
                    ))}
                </>
            )}
            {staticProperties.length > 0 && (
                <>
                    <SectionHeading>Static Properties</SectionHeading>
                    {staticProperties.map(prop => (
                        <Variable key={prop.name} variable={prop} />
                    ))}
                </>
            )}
        </>
    );
}
