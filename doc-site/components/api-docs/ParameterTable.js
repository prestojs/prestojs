import React from 'react';
import MdxWrapper from './MdxWrapper';
import TypeDesc from './TypeDesc';

export default function ParameterTable({ parameters, nameHeader = 'Parameter', isReturnType }) {
    return (
        parameters.length > 0 && (
            <table className="w-full text-left table-collapse mt-5 mb-5 z-10 relative">
                <thead>
                    <tr>
                        {!isReturnType && (
                            <th className="text-sm font-semibold text-gray-700 p-2 bg-gray-100" />
                        )}
                        <th className="text-sm font-semibold text-gray-700 p-2 bg-gray-100">
                            {nameHeader}
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
                    {parameters.map(param => {
                        const deprecated = 'deprecated' in (param.comment?.tagsByName || {});
                        const deprecatedReason = deprecated
                            ? param.comment.tagsByName.deprecated
                            : '';
                        return (
                            <tr key={param.name}>
                                {!isReturnType && (
                                    <td
                                        className={`p-2 border-t font-semibold border-gray-300 font-mono text-xs text-red-600 whitespace-nowrap align-top`}
                                    >
                                        {!param.flags?.isOptional && (
                                            <abbr title="Required">*</abbr>
                                        )}
                                    </td>
                                )}
                                <td
                                    className={`p-2 border-t font-semibold border-gray-300 font-mono text-xs text-purple-700 whitespace-nowrap align-top`}
                                >
                                    {deprecated ? (
                                        <span className="line-through">{param.name}</span>
                                    ) : (
                                        param.name
                                    )}
                                </td>
                                <td
                                    className={`p-2 border-t font-semibold border-gray-300 font-mono text-xs align-top`}
                                >
                                    <TypeDesc doc={param} isReturnType={isReturnType} />
                                </td>
                                <td className="p-2 border-t border-gray-300 font-mono text-xs text-blue-700 align-top table-mdx">
                                    <MdxWrapper mdx={param.mdx} />
                                    {deprecated && (
                                        <div className="text-red-400">
                                            Deprecated{deprecatedReason && `: ${deprecatedReason}`}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        )
    );
}
