import React from 'react';
import { expandProperties } from '../../util';
import AnchorLink from '../AnchorLink';
import SourceLink from '../SourceLink';
import MdxWrapper from './MdxWrapper';
import ReturnType from './ReturnType';
import SignatureDefinition from './SignatureDefinition';
import TypeDesc from './TypeDesc';

export default function SignatureDoc({
    signature,
    method,
    anchorLink,
    isConstructor,
    bordered = true,
    hideName = false,
    hideParamDescription = false,
}) {
    const restPropName = signature.comment?.tagsByName?.['rest-prop-name'];
    const parameters = (signature.parameters || []).reduce((acc, param) => {
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
                parameters={(signature.parameters || []).map(p => ({
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
            {parameters.length > 0 && (
                <table className="w-full text-left table-collapse mt-5 mb-5">
                    <thead>
                        <tr>
                            <th className="text-sm font-semibold text-gray-700 p-2 bg-gray-100">
                                Parameter
                            </th>
                            <th className="text-sm font-semibold text-gray-700 p-2 bg-gray-100">
                                Type
                            </th>
                            {!hideParamDescription && (
                                <th className="text-sm font-semibold text-gray-700 p-2 bg-gray-100">
                                    Description
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {parameters.map(param => (
                            <tr key={param.name}>
                                <td
                                    className={`p-2 border-t font-semibold border-gray-300 font-mono text-xs text-purple-700 whitespace-no-wrap align-top`}
                                >
                                    {param.name}
                                </td>
                                <td
                                    className={`p-2 border-t font-semibold border-gray-300 font-mono text-xs align-top`}
                                >
                                    <TypeDesc doc={param} />
                                </td>
                                {!hideParamDescription && (
                                    <td className="p-2 border-t border-gray-300 font-mono text-xs text-blue-700 align-top table-mdx">
                                        <MdxWrapper mdx={param.mdx} />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {!isConstructor && <ReturnType signature={signature} />}
        </div>
    );
}
