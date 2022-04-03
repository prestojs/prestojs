import React from 'react';
import { JSONOutput } from 'typedoc';
import AnchorLink, { generateId } from './AnchorLink';
import SignatureDoc from './SignatureDoc';
import Variable from './Variable';

type MethodOrPropertyDetails<T extends JSONOutput.DeclarationReflection> = {
    direct: T[];
    inherited: T[];
    total: number;
};

function MethodDoc({ method }) {
    if (method.name === 'getRequestInit') {
        console.log('haha', method);
    }
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
            component="h2"
            id={id || generateId(children)}
            className="group flex whitespace-pre-wrap text-md text-cyan-500 font-semibold"
        >
            {children}
        </AnchorLink>
    );
}

export default function ClassDetails({
    constructor,
    methods,
    properties,
    staticMethods,
    staticProperties,
}: {
    constructor?: JSONOutput.DeclarationReflection;
    methods: JSONOutput.DeclarationReflection[];
    properties: JSONOutput.DeclarationReflection[];
    staticMethods: JSONOutput.DeclarationReflection[];
    staticProperties: JSONOutput.DeclarationReflection[];
}) {
    return (
        <>
            {constructor && (
                <>
                    <SectionHeading>Constructor</SectionHeading>
                    {constructor.signatures?.map((sig, i) => (
                        <SignatureDoc key={i} signature={sig} />
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
                    {properties
                        .map(prop => prop.getSignature?.[0] || prop)
                        .map(prop => (
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
