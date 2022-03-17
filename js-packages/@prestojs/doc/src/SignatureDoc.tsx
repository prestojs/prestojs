import React from 'react';
import { JSONOutput } from 'typedoc';
import { useResolvedTypes } from './DocProvider';
import FunctionSignature from './FunctionSignature';
import PrecompiledMarkdown from './PrecompiledMarkdown';
import SourceLink from './SourceLink';
import Table from './Table';
import TypeName from './TypeName';

type Props = {
    signature: JSONOutput.SignatureReflection;
};

function SignatureParametersTable(props: {
    parameters: JSONOutput.ParameterReflection[];
}): React.ReactElement {
    const parameters = useResolvedTypes(props.parameters);
    console.log(props.parameters, parameters);
    return (
        <Table<JSONOutput.ParameterReflection>
            columns={[
                {
                    title: '',
                    key: 'required',
                    render(_, param) {
                        if (!param.flags?.isOptional && !param.defaultValue) {
                            return (
                                <abbr
                                    className="text-red-500 underline decoration-dotted"
                                    title="Required"
                                >
                                    *
                                </abbr>
                            );
                        }
                        return null;
                    },
                },
                {
                    title: 'Parameter',
                    key: 'name',
                    className: 'font-semibold font-mono text-xs text-purple-700 whitespace-nowrap',
                },
                {
                    title: 'Type',
                    key: 'type',
                    render: (type, property): React.ReactNode => {
                        if (type) {
                            return <TypeName type={type} />;
                        }
                        console.log(property);
                        return 'TODO';
                    },
                },
                {
                    title: 'Description',
                    key: 'description',
                    className: 'font-mono text-xs text-blue-700 align-top td-type-desc',
                    render: (type, property): React.ReactNode => {
                        return (
                            <>
                                {property.comment?.shortTextMdx && (
                                    <PrecompiledMarkdown code={property.comment?.shortTextMdx} />
                                )}
                                {property.comment?.textMdx && (
                                    <PrecompiledMarkdown code={property.comment?.textMdx} />
                                )}
                            </>
                        );
                    },
                },
            ]}
            data={parameters}
            rowKey="id"
        />
    );
}

export default function SignatureDoc({ signature }: Props) {
    console.log(signature);
    return (
        <div className="pt-3 mt-3 border-t-2 border-gray-200">
            <div className="flex items-center justify-between mb-5">
                <FunctionSignature signature={signature} className="text-2xl text-gray-600" />
                <SourceLink declaration={signature} />
            </div>
            {signature.comment?.shortTextMdx && (
                <PrecompiledMarkdown code={signature.comment.shortTextMdx} />
            )}
            {signature.comment?.textMdx && <PrecompiledMarkdown code={signature.comment.textMdx} />}
            {signature.parameters && <SignatureParametersTable parameters={signature.parameters} />}
        </div>
    );
}
