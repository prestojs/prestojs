import React from 'react';
import MethodDoc from '../../api-docs/MethodDoc';
import AnchorLink from '../AnchorLink';
import SignatureDoc from './SignatureDoc';
import VariableDoc from './VariableDoc';

export default function ClassDetails({
    constructor,
    methods,
    properties,
    staticMethods,
    staticProperties,
}) {
    return (
        <>
            {constructor && (
                <>
                    <AnchorLink id="constructor" Component="h3" className="text-4xl">
                        Constructor
                    </AnchorLink>
                    {constructor.signatures.map((sig, i) => (
                        <SignatureDoc key={i} signature={sig} method={constructor} isConstructor />
                    ))}
                </>
            )}
            {methods.direct.length > 0 && (
                <>
                    <h3 className="text-4xl mt-10">Methods</h3>
                    {methods.direct.map(method => (
                        <MethodDoc key={method.name} method={method} />
                    ))}
                </>
            )}
            {staticMethods.direct.length > 0 && (
                <>
                    <h3 className="text-4xl mt-10">Static Methods</h3>
                    {staticMethods.direct.map(method => (
                        <MethodDoc key={method.name} method={method} anchorPrefix="static-method" />
                    ))}
                </>
            )}
            {properties.direct.length > 0 && (
                <>
                    <h3 className="text-4xl mt-10">Properties</h3>
                    {properties.direct.map(prop => (
                        <VariableDoc key={prop.name} doc={prop} />
                    ))}
                </>
            )}
            {staticProperties.direct.length > 0 && (
                <>
                    <h3 className="text-4xl mt-10">Static Properties</h3>
                    {staticProperties.direct.map(prop => (
                        <VariableDoc key={prop.name} doc={prop} anchorPrefix="static-var" />
                    ))}
                </>
            )}
            {methods.inherited.length > 0 && (
                <>
                    <h3 className="text-4xl mt-10">Inherited Methods</h3>
                    {methods.inherited.map(method => (
                        <MethodDoc key={method.name} method={method} anchorPrefix="inh-method" />
                    ))}
                </>
            )}
            {staticMethods.inherited.length > 0 && (
                <>
                    <h3 className="text-4xl mt-10">Inherited Static Methods</h3>
                    {staticMethods.inherited.map(method => (
                        <MethodDoc
                            key={method.name}
                            method={method}
                            anchorPrefix="static-inh-method"
                        />
                    ))}
                </>
            )}
            {properties.inherited.length > 0 && (
                <>
                    <h3 className="text-4xl mt-10">Inherited Properties</h3>
                    {properties.inherited.map(prop => (
                        <VariableDoc key={prop.name} doc={prop} anchorPrefix="inh-var" />
                    ))}
                </>
            )}
            {staticProperties.inherited.length > 0 && (
                <>
                    <h3 className="text-4xl mt-10">Inherited Static Properties</h3>
                    {staticProperties.inherited.map(prop => (
                        <VariableDoc key={prop.name} doc={prop} anchorPrefix="static-inh-var" />
                    ))}
                </>
            )}
        </>
    );
}
