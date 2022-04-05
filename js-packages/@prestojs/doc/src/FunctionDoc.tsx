import React from 'react';
import CodeExamples from './CodeExamples';
import DocHeader from './DocHeader';
import SignatureDoc from './SignatureDoc';
import { DocNode } from './types';

type Props = {
    node: DocNode;
};

export default function FunctionDoc({ node }: Props) {
    if (!node.declaration.signatures) {
        throw new Error('Invalid function node');
    }
    const excludeParameterNames = node.declaration.docFlags.isForwardRef ? ['ref'] : [];
    return (
        <div>
            <DocHeader node={node} />
            {node.declaration.signatures.map((signature, i) => (
                <div className="pt-3 mt-3 border-t-2 border-gray-200" key={i}>
                    <SignatureDoc
                        signature={signature}
                        excludeParameterNames={excludeParameterNames}
                    />
                </div>
            ))}
            {node.meta.examples && <CodeExamples examples={node.meta.examples} />}
        </div>
    );
}
