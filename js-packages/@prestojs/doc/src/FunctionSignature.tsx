import React from 'react';
import { JSONOutput } from 'typedoc';
import TypeName from './TypeName';
import TypeParameters from './TypeParameters';

type Props = {
    signature: JSONOutput.SignatureReflection;
    showReturn?: boolean;
    className?: string;
};

export default function FunctionSignature({ signature, showReturn = false, className }: Props) {
    const { parameters = [], typeParameter } = signature;
    return (
        <div className={className}>
            <span className="font-bold">{signature.name}</span>
            {typeParameter && <TypeParameters typeParameter={typeParameter} />}(
            {parameters.map((param, i) => (
                <React.Fragment key={param.name}>
                    <span className="text-gray-500">
                        {param.flags?.isOptional && '?'}
                        {param.flags?.isRest && '...'}
                        {param.name}
                    </span>
                    {i < parameters.length - 1 && <span className="text-gray-300 mr-1">,</span>}
                </React.Fragment>
            ))}
            )
            {showReturn && signature.type && (
                <>
                    {' '}
                    {'=>'}
                    <TypeName type={signature.type} />
                </>
            )}
        </div>
    );
}
