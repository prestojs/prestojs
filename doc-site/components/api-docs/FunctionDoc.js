import React from 'react';
import ApiDocHeader from '../ApiDocHeader';
import Article from '../Article';
import MdxWrapper from './MdxWrapper';
import SignatureDoc from './SignatureDoc';

export default function FunctionDoc({ doc }) {
    const excludeParameters = doc.isForwardRef ? ['ref'] : [];
    return (
        <Article>
            <ApiDocHeader doc={doc} />
            {doc.mdx && <MdxWrapper mdx={doc.mdx} />}
            {doc.signatures.map((sig, i) => (
                <SignatureDoc key={i} signature={sig} excludeParameters={excludeParameters} />
            ))}
        </Article>
    );
}
