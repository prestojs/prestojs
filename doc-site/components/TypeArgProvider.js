import React, { useContext } from 'react';

const TypeArgContext = React.createContext();

export function useTypeArguments() {
    const { typeArguments = {} } = useContext(TypeArgContext) || {};
    return typeArguments;
}

export default function TypeArgProvider({ typeArguments, children }) {
    return <TypeArgContext.Provider value={{ typeArguments }}>{children}</TypeArgContext.Provider>;
}
