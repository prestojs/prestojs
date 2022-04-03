import React, { useContext, useMemo } from 'react';
import { DeclarationReflection } from './types';

type DocContext = {
    referencedTypes: Record<string, DeclarationReflection>;
};

const context = React.createContext<DocContext | null>(null);

export function useDocContext(): DocContext | null {
    return useContext(context);
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
