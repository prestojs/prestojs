import Type from '@prestojs/doc/components/Type';
import TypeTable from '@prestojs/doc/components/TypeTable';
import React from 'react';
import { Signature } from '../newTypes';
import AnchorLink from './AnchorLink';
import Description from './Description';
import FunctionSignature from './FunctionSignature';
import PrecompiledMarkdown from './PrecompiledMarkdown';
import SourceLink from './SourceLink';

type Props = {
    signature: Signature;
    excludeParameterNames?: string[];
    hideTypeParameters?: boolean;
    hideReturnType?: boolean;
};

export default function FunctionDocumentation({
    signature,
    excludeParameterNames = [],
    hideTypeParameters,
    hideReturnType,
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
            {parameters.length > 0 && (
                <div className="my-5">
                    <strong className="pb-3 block">Params:</strong>
                    <TypeTable dataSource={parameters} attributeHeader="Parameter" />
                </div>
            )}
            {!hideReturnType && signature.returnType && (
                <div className="my-5">
                    <strong className="pb-3 block">Returns:</strong>
                    <Type type={signature.returnType} />
                    {signature.description?.returns && (
                        <div>
                            <PrecompiledMarkdown code={signature.description.returns} />
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
