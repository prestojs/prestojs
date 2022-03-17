import React from 'react';
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
    return (
        <div>
            <DocHeader node={node} />
            {node.declaration.signatures.map((signature, i) => (
                <SignatureDoc signature={signature} key={i} />
            ))}
        </div>
    );
}
