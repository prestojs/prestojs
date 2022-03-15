import React from 'react';
import { JSONOutput } from 'typedoc';
import TypeName from './TypeName';

type Props = {
    signature: JSONOutput.SignatureReflection;
};

export default function FunctionSignature({ signature }: Props) {
    const { parameters = [] } = signature;
    return (
        <div>
            <span className="font-bold">{signature.name}</span>(
            {parameters.map((param, i) => (
                <React.Fragment key={param.name}>
                    <span className="text-gray-600">
                        {param.flags?.isOptional && '?'}
                        {param.name}
                    </span>
                    {i < parameters.length - 1 && <span className="text-gray-400 mr-1">,</span>}
                </React.Fragment>
            ))}
            )
            {signature.type && (
                <>
                    {' '}
                    {'=>'}
                    <TypeName type={signature.type} />
                </>
            )}
        </div>
    );
}
