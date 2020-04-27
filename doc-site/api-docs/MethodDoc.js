import React from 'react';
import SignatureDoc from '../components/api-docs/SignatureDoc';

export function getSignatureId(method, signature) {
    const i = method.signatures.indexOf(signature);
    return i === 0 ? `method-${method.name}` : `method-${method.name}-${i}`;
}

export default function MethodDoc({ method }) {
    return (
        <div>
            {method.signatures.map((sig, i) => (
                <SignatureDoc
                    key={i}
                    signature={sig}
                    method={method}
                    anchorLink={getSignatureId(method, sig)}
                />
            ))}
        </div>
    );
}
