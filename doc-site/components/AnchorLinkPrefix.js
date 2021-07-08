import React from 'react';

const AnchorLinkPrefixContext = React.createContext('');

export default function AnchorLinkPrefix({ prefix, children }) {
    return (
        <AnchorLinkPrefixContext.Provider value={prefix}>
            {children}
        </AnchorLinkPrefixContext.Provider>
    );
}

export function useAnchorLinkPrefix() {
    return React.useContext(AnchorLinkPrefixContext) || '';
}
