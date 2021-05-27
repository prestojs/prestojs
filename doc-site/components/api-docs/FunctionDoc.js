import React from 'react';
import ApiDocHeader from '../ApiDocHeader';
import Article from '../Article';
import CodeExamples from './CodeExamples';
import MdxWrapper from './MdxWrapper';
import SignatureDoc from './SignatureDoc';

export default function FunctionDoc({ doc }) {
    const excludeParameters = doc.isForwardRef ? ['ref'] : [];
    const isComponent = doc.name[0].toUpperCase() === doc.name[0];
    return (
        <Article>
            <ApiDocHeader doc={doc} isComponent={isComponent} />
            {doc.mdx && <MdxWrapper mdx={doc.mdx} />}
            {doc.signatures.map((sig, i) => (
                <SignatureDoc
                    // For components don't show return value - doesn't convey any useful
                    // information and can be confusing
                    showReturn={!isComponent}
                    signatureDefinitionTag="div"
                    key={i}
                    signature={sig}
                    excludeParameters={excludeParameters}
                />
            ))}
            {doc.examples && <CodeExamples examples={doc.examples} />}
        </Article>
    );
}
