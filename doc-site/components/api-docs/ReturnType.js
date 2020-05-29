import React from 'react';
import { expandProperties } from '../../util';
import MdxWrapper from './MdxWrapper';
import ParameterTable from './ParameterTable';
import TypeDesc from './TypeDesc';

export default function ReturnType({ signature }) {
    const [, c] = (signature.type && expandProperties(signature.type, true)) || [];
    let isConstructor = false;
    if (c) {
        // Don't expand properties for these... kind of weird when this happens when
        // the returned value is a class
        isConstructor = c.filter(({ name }) => name === 'constructor').length > 0;
    }
    return (
        <div className="mt-5">
            <h3>Returns</h3>
            <TypeDesc type={signature.type} />
            {!isConstructor && c && <ParameterTable parameters={c} nameHeader="Key" isReturnType />}
            {signature.mdxReturns && <MdxWrapper mdx={signature.mdxReturns} />}
        </div>
    );
}
