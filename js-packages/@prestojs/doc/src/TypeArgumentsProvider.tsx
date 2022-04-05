import React, { useContext, useMemo } from 'react';
import { JSONOutput } from 'typedoc';
import { useDocContext } from './DocProvider';
import { DeclarationReflection } from './types';

interface TypeArgumentValue {
    typeArgument: JSONOutput.TypeParameterReflection;
    resolvedType: null | JSONOutput.Type;
}

type TypeArgumentsContext = {
    typeArguments: Record<string, TypeArgumentValue>;
};

const context = React.createContext<TypeArgumentsContext>({ typeArguments: {} });

export function useTypeArgumentsContext(): TypeArgumentsContext {
    return useContext(context);
}

function resolveTypeArguments(
    type: JSONOutput.SomeType,
    referencedTypes: Record<string, JSONOutput.DeclarationReflection>,
    types: any[]
) {
    if (type.type === 'reference') {
        if (type.id && referencedTypes[type.id]) {
            const referencedType = referencedTypes[type.id];
            const referencedExtendedTypes = referencedType.extendedTypes;
            if (referencedExtendedTypes && referencedExtendedTypes.length > 0) {
                // @ts-ignore
                const { typeArguments = [] } = referencedExtendedTypes[0];
                return resolveTypeArguments(referencedExtendedTypes[0], referencedTypes, [
                    ...types,
                    ...typeArguments.slice(types.length),
                ]);
            } else if (referencedType.typeParameter) {
                return referencedType.typeParameter.map((typeArgument, i) => ({
                    typeArgument,
                    resolvedType: types[i],
                }));
            }
        }
    }
    return [];
}

export default function TypeArgumentsProvider({
    declaration,
    children,
}: {
    declaration: DeclarationReflection;
    children: React.ReactNode;
}): React.ReactElement {
    const docContext = useDocContext();
    const { extendedTypes } = declaration;
    const value = useMemo(() => {
        if (extendedTypes && extendedTypes.length > 0) {
            const resolvedTypes = resolveTypeArguments(
                extendedTypes[0],
                docContext?.referencedTypes || {},
                // @ts-ignore
                extendedTypes[0].typeArguments || []
            );
            console.log('rofl', declaration.typeParameter);
            return {
                typeArguments: resolvedTypes.reduce((acc, t) => {
                    acc[t.typeArgument.name] = t;
                    return acc;
                }, {}),
            };
        }
        return { typeArguments: {} };
    }, [extendedTypes, docContext]);
    return <context.Provider value={value}>{children}</context.Provider>;
}
