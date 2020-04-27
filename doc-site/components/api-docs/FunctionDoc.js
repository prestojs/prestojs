import React from 'react';
import ApiDocHeader from '../ApiDocHeader';
import Article from '../Article';
import SignatureDoc from './SignatureDoc';

export default function FunctionDoc({ doc }) {
    return (
        <Article>
            <ApiDocHeader doc={doc} />
            {doc.mdx && <div dangerouslySetInnerHTML={{ __html: doc.mdx }} />}
            {doc.signatures.map(sig => (
                <SignatureDoc signature={sig} />
            ))}
        </Article>
    );
}
