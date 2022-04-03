import React from 'react';
import { JSONOutput } from 'typedoc';
import AnchorLink from './AnchorLink';
import Comment from './Comment';
import DeclarationsTable from './DeclarationsTable';
import FunctionSignature from './FunctionSignature';
import PrecompiledMarkdown from './PrecompiledMarkdown';
import SourceLink from './SourceLink';
import TypeName, { TypeNameProvider } from './TypeName';

type Props = {
    signature: JSONOutput.SignatureReflection;
};

export default function SignatureDoc({ signature }: Props) {
    return (
        <>
            <div className="flex items-center justify-between mb-5">
                <AnchorLink component="div" id={signature.anchorId}>
                    <FunctionSignature
                        signature={signature}
                        className="text-xl text-gray-700 font-semibold"
                    />
                </AnchorLink>
                <SourceLink declaration={signature} />
            </div>
            <Comment comment={signature.comment} />
            {signature.parameters && (
                <div className="my-5">
                    <strong className="pb-3 block">Params:</strong>
                    <DeclarationsTable
                        declarations={signature.parameters}
                        showRequiredColumn
                        attributeHeader="Parameter"
                    />
                </div>
            )}
            {signature.kindString !== 'Constructor signature' && signature.type && (
                <div className="my-5">
                    <strong className="pb-3 block">Returns:</strong>
                    <TypeNameProvider mode="EXPANDED">
                        <TypeName type={signature.type} />
                    </TypeNameProvider>
                    {signature.comment?.returnsMdx && (
                        <div>
                            <PrecompiledMarkdown code={signature.comment.returnsMdx} />
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
