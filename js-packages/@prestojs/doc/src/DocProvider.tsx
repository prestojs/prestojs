import React, { useContext, useMemo } from 'react';
import { DeclarationReflection } from './types';

type DocContext = {
    referencedTypes: Record<string, DeclarationReflection>;
};

const context = React.createContext<DocContext | null>(null);

export function useDocContext(): DocContext | null {
    return useContext(context);
}

export function useResolvedTypes(declarations: DeclarationReflection[]): DeclarationReflection[] {
    const context = useDocContext();
    if (!context) {
        return declarations;
    }
    return declarations.map(declaration => {
        const { type } = declaration;
        if (type?.type === 'reference' && type.id) {
            const resolved = context.referencedTypes[type.id];
            if (resolved) {
                declaration = { ...declaration, type: resolved.type };
            }
        }
        if (declaration.docFlags.expandProperties) {
            console.log('lol');
        }
        return declaration;
    });
}

export default function DocProvider({
    referencedTypes,
    children,
}: {
    referencedTypes: Record<string, DeclarationReflection>;
    children: React.ReactNode;
}): React.ReactElement {
    const value = useMemo(
        () => ({
            referencedTypes,
        }),
        [referencedTypes]
    );
    return <context.Provider value={value}>{children}</context.Provider>;
}
