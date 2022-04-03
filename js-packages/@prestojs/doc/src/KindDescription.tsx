import React from 'react';
import FunctionDescription from './FunctionDescription';
import { DeclarationReflection } from './types';

export default function KindDescription({ declaration }: { declaration: DeclarationReflection }) {
    if (
        declaration.kindString === 'Method' ||
        (declaration.kindString === 'Type literal' && declaration.signatures)
    ) {
        return <FunctionDescription signatures={declaration.signatures} />;
    }
    return <>{declaration.name}</>;
}
