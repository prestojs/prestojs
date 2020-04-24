import React, { useContext } from 'react';

export const MdxScopeContext = React.createContext();

export default function useMdxScope() {
    return useContext(MdxScopeContext);
}
