import React from 'react';
import AnchorLink from '../AnchorLink';
import TypeDesc from './TypeDesc';

export default function SignatureDefinition({
    name,
    parameters,
    returnType,
    tag = 'div',
    overloadDesc = null,
    ...rest
}) {
    const Tag = tag;
    return (
        <Tag {...rest}>
            <span className="font-bold">{name}</span>
            <span className="signature-params">
                (
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
            </span>
            {returnType && (
                <>
                    {' '}
                    {'=>'} <TypeDesc type={returnType} />
                </>
            )}
            {overloadDesc && (
                <div className="text-gray-600 underline">
                    <AnchorLink Component="div" id={overloadDesc}>
                        {overloadDesc}
                    </AnchorLink>
                </div>
            )}
        </Tag>
    );
}
