import React from 'react';
import { expandProperties } from '../../util';
import AnchorLink from '../AnchorLink';
import MdxWrapper from './MdxWrapper';
import ParameterTable from './ParameterTable';
import TypeDesc from './TypeDesc';

const classTypeNames = ['ViewModelInterface'];

export default function ReturnType({ signature }) {
    const returnTypes = [];
    const type = signature.type.referencedType?.().type || signature.type;
    if (type.type === 'array' && type.elementType.type === 'union') {
        const newTypes = type.elementType.types.map(t => ({
            type: 'array',
            elementType: t,
        }));
        return (
            <ReturnType
                signature={{
                    ...signature,
                    type: {
                        type: 'union',
                        types: newTypes,
                    },
                }}
            />
        );
    }
    if (type.type === 'union') {
        const types = type.types;
        returnTypes.push(...types.map(t => [t, expandProperties(t, true)?.[1] || []]));
    } else {
        const [, c] = (signature.type && expandProperties(signature.type, true)) || [];
        returnTypes.push([signature.type, c]);
    }
    return (
        <div className="mt-5">
            <AnchorLink id="return-type" Component="div" className="text-xl">
                Returns
            </AnchorLink>
            {returnTypes.length > 1 && <p className="my-5">One of the following:</p>}
            {returnTypes.map(([type, c], i) => {
                let isConstructor = classTypeNames.includes(type.name);
                if (c) {
                    // Don't expand properties for these... kind of weird when this happens when
                    // the returned value is a class
                    isConstructor =
                        isConstructor || c.filter(({ name }) => name === 'constructor').length > 0;
                }
                return (
                    <React.Fragment key={i}>
                        <TypeDesc type={type} />
                        {!isConstructor && c && (
                            <ParameterTable parameters={c} nameHeader="Key" isReturnType />
                        )}
                        {i !== returnTypes.length - 1 && <p className="my-10 text-center">OR</p>}
                    </React.Fragment>
                );
            })}
            {signature.mdxReturns && <MdxWrapper mdx={signature.mdxReturns} />}
        </div>
    );
}
