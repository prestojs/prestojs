import React from 'react';
import { expandProperties } from '../../util';
import AnchorLink from '../AnchorLink';
import SourceLink from '../SourceLink';
import MdxWrapper from './MdxWrapper';
import ParameterTable from './ParameterTable';
import ReturnType from './ReturnType';
import SignatureDefinition from './SignatureDefinition';

export default function SignatureDoc({
    signature,
    method,
    anchorLink,
    isConstructor,
    signatureDefinitionTag = 'h4',
    bordered = true,
    hideName = false,
    excludeParameters = [],
}) {
    const restPropName = signature.comment?.tagsByName?.['rest-prop-name'];
    const rawParameters = (signature.parameters || []).filter(
        param => !excludeParameters.includes(param.name)
    );
    const parameters = rawParameters.reduce((acc, param) => {
        const t = expandProperties(param);
        if (t) {
            const [name, children, desc] = t;
            if (desc) {
                acc.push({
                    name,
                    mdx: desc,
                });
            }
            let restChild;
            for (const child of children) {
                if (child.name === restPropName) {
                    restChild = {
                        ...child,
                        name: '...rest',
                    };
                } else {
                    acc.push({
                        ...child,
                        name: `${name}.${child.name}`,
                    });
                }
            }
            // Always make sure the ...rest comes last in the param table
            if (restChild) {
                acc.push(restChild);
            }
        } else {
            acc.push(param);
        }
        return acc;
    }, []);
    const sigClassName = 'text-2xl text-gray-700 mt-12';
    const sigName = (
        <span className="flex items-center justify-between">
            <SignatureDefinition
                name={signature.name}
                tag={signatureDefinitionTag}
                parameters={rawParameters.map(p => ({
                    ...p,
                    name: p.name === '__namedParameters' ? 'props' : p.name,
                }))}
            />
            {method && <SourceLink doc={method} />}
        </span>
    );
    const header = anchorLink ? (
        <AnchorLink id={anchorLink} Component="div" className={sigClassName}>
            {sigName}
        </AnchorLink>
    ) : (
        <span className={sigClassName}>{sigName}</span>
    );
    return (
        <div className={bordered ? 'pt-3 mt-3 border-t-2 border-gray-200' : ''}>
            {!hideName && header}
            <MdxWrapper mdx={signature.mdx} />
            {parameters.length > 0 && <ParameterTable parameters={parameters} />}
            {!isConstructor && <ReturnType signature={signature} />}
        </div>
    );
}
