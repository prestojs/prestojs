import React from 'react';
import { Signature } from '../newTypes';
import AnchorLink from './AnchorLink';
import Description from './Description';
import FunctionSignature from './FunctionSignature';
import PrecompiledMarkdown from './PrecompiledMarkdown';
import SourceLink from './SourceLink';
import Type from './Type';
import TypeTable from './TypeTable';

type Props = {
    signature: Signature;
    excludeParameterNames?: string[];
    hideTypeParameters?: boolean;
    hideReturnType?: boolean;
    hideParameters?: boolean;
    prologue?: React.ReactNode;
};

export default function FunctionDocumentation({
    signature,
    excludeParameterNames = [],
    hideTypeParameters,
    hideReturnType,
    hideParameters,
    prologue,
}: Props) {
    const parameters = signature.parameters.filter(
        param => !excludeParameterNames.includes(param.name)
    );

    return (
        <>
            <div className="flex items-center justify-between mb-5">
                <AnchorLink component="div" id={signature.anchorId}>
                    <FunctionSignature
                        signature={signature}
                        className="text-xl text-gray-700 font-semibold"
                        excludeParameterNames={excludeParameterNames}
                        hideTypeParameters={hideTypeParameters}
                    />
                </AnchorLink>
                <SourceLink sourceLocation={signature.sourceLocation} />
            </div>
            <Description description={signature.description} />
            {prologue}
            {!hideParameters && parameters.length > 0 && (
                <div className="my-5 overflow-x-auto">
                    <AnchorLink
                        className="font-bold"
                        component="h3"
                        id={`${signature.anchorId}-props`}
                    >
                        {signature.isComponent ? 'Component Props' : 'Arguments'}:
                    </AnchorLink>
                    <TypeTable
                        dataSource={parameters}
                        attributeHeader={signature.isComponent ? 'Prop' : 'Argument'}
                    />
                </div>
            )}
            {!signature.isComponent && !hideReturnType && signature.returnType && (
                <div className="my-5">
                    <strong className="pb-3 block">Returns:</strong>
                    <Type type={signature.returnType} />
                    {signature.description?.returns && (
                        <div className="mt-5">
                            <PrecompiledMarkdown code={signature.description.returns} />
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
