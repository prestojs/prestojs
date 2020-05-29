import React from 'react';
import { expandProperties } from '../../util';
import MdxWrapper from './MdxWrapper';
import ParameterTable from './ParameterTable';
import TypeDesc from './TypeDesc';

// Don't expand properties for these... kind of weird when this happens when
// the returned value is a class
const expandIgnoreNames = ['ViewModelConstructor', 'ViewModelInterface'];

export default function ReturnType({ signature }) {
    const [, c] = (signature.type && expandProperties(signature.type, true)) || [];
    return (
        <div className="mt-5">
            <h3>Returns</h3>
            <TypeDesc type={signature.type} />
            {!expandIgnoreNames.includes(signature.type?.name) && c && (
                <ParameterTable parameters={c} nameHeader="Key" isReturnType />
            )}
            {signature.mdxReturns && <MdxWrapper mdx={signature.mdxReturns} />}
        </div>
    );
}
