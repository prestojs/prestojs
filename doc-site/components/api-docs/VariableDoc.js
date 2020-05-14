import React from 'react';
import { expandProperties } from '../../util';
import AnchorLink from '../AnchorLink';
import MdxWrapper from './MdxWrapper';
import ParameterTable from './ParameterTable';
import TypeDesc from './TypeDesc';

export default function VariableDoc({ doc, anchorPrefix = 'var' }) {
    let extra;
    const [, properties] = expandProperties(doc) || [];
    if (properties) {
        extra = <ParameterTable parameters={properties} nameHeader="Key" />;
    }

    return (
        <div className="border-t-2 border-gray-200 mt-3 pt-3">
            <AnchorLink
                id={`${anchorPrefix}-${doc.name}`}
                Component="div"
                className="text-2xl text-gray-700 mt-12"
            >
                <span className="flex">
                    <span className="mr-2">{doc.name}:</span> <TypeDesc doc={doc} />
                </span>
            </AnchorLink>
            {extra}
            <MdxWrapper mdx={doc.mdx} />
        </div>
    );
}
