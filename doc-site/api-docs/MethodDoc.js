import React from 'react';
import SignatureDoc from '../components/api-docs/SignatureDoc';

export function getSignatureId(method, signature, anchorPrefix = 'metho' + 'd') {
    const i = method.signatures.indexOf(signature);
    return i === 0 ? `${anchorPrefix}-${method.name}` : `${anchorPrefix}-${method.name}-${i}`;
}

export default function MethodDoc({ method, anchorPrefix = 'method' }) {
    return (
        <div>
            {method.signatures.map((sig, i) => (
                <SignatureDoc
                    key={i}
                    signature={sig}
                    method={method}
                    anchorLink={getSignatureId(method, sig, anchorPrefix)}
                />
            ))}
        </div>
    );
}
