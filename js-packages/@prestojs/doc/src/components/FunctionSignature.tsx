import React from 'react';
import { Signature } from '../newTypes';
import Type from './Type';
import TypeParameters from './TypeParameters';

type Props = {
    signature: Signature;
    showReturn?: boolean;
    className?: string;
    excludeParameterNames?: string[];
    hideTypeParameters?: boolean;
};

export default function FunctionSignature({
    signature,
    showReturn = false,
    className,
    excludeParameterNames = [],
    hideTypeParameters = false,
}: Props) {
    // const { typeParameter } = signature;
    const parameters =
        signature.parameters?.filter(param => !excludeParameterNames.includes(param.name)) || [];
    return (
        <div className={className}>
            <span className="font-bold">{signature.name}</span>
            {!hideTypeParameters && signature.typeParameters && (
                <TypeParameters typeParameters={signature.typeParameters} />
            )}
            <span className="signature-params">
                (
                {parameters.map((param, i) => (
                    <React.Fragment key={param.name}>
                        <span className="text-gray-500">
                            {param.flags.isOptional && '?'}
                            {param.flags.isRestArg && '...'}
                            {param.name}
                        </span>
                        {i < parameters.length - 1 && <span className="text-gray-300 mr-1">,</span>}
                    </React.Fragment>
                ))}
                )
            </span>
            {showReturn && signature.returnType && (
                <>
                    {' '}
                    {'=>'}
                    <Type type={signature.returnType} />
                </>
            )}
        </div>
    );
}
