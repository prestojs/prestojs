import React from 'react';
import AnchorLink from '../AnchorLink';
import SourceLink from '../SourceLink';
import MdxWrapper from './MdxWrapper';
import SignatureDefinition from './SignatureDefinition';
import TypeDesc from './TypeDesc';

const expandProperties = (param, force) => {
    const paramType = param.type || param;
    if (force && paramType.declaration?.children) {
        return [param.name, paramType.declaration.children];
    }

    if (
        paramType?.referencedType?.()?.comment?.tagsByName?.['expand-properties'] ||
        (force && param.referencedType?.())
    ) {
        const t = paramType?.referencedType?.() || param.referencedType?.();
        const desc = t.comment?.tagsByName['expand-properties']?.mdx;
        if (t.type?.type === 'intersection') {
            const children = [];
            for (const type of t.type.types) {
                const [, c] = expandProperties(type, true) || [];
                if (c) {
                    children.push(...c);
                }
            }
            return [param.name, children, desc];
        }
        if (!t.children) {
            const [, c] = expandProperties(t, true);
            return [param.name, c];
        }
        return [param.name, t.children || []];
    }
    if (param.name === '__namedParameters') {
        return ['props', paramType.declaration.children];
    }
};

export default function SignatureDoc({ signature, method, anchorLink }) {
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
                returnType={signature.type}
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
        <div className="border-t-2 border-gray-200 mt-3 pt-3">
            {header}
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
                            <th className="text-sm font-semibold text-gray-700 p-2 bg-gray-100">
                                Description
                            </th>
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
                                <td className="p-2 border-t border-gray-300 font-mono text-xs text-blue-700 align-top table-mdx">
                                    <MdxWrapper mdx={param.mdx} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
