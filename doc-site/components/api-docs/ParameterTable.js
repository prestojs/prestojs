import React from 'react';
import MdxWrapper from './MdxWrapper';
import TypeDesc from './TypeDesc';

export default function ParameterTable({ parameters, nameHeader = 'Parameter', isReturnType }) {
    return (
        parameters.length > 0 && (
            <table className="w-full text-left table-collapse mt-5 mb-5">
                <thead>
                    <tr>
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
                                <TypeDesc doc={param} isReturnType={isReturnType} />
                            </td>
                            <td className="p-2 border-t border-gray-300 font-mono text-xs text-blue-700 align-top table-mdx">
                                <MdxWrapper mdx={param.mdx} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    );
}
