import React, { useMemo } from 'react';

import ModelView from './ModelView';

export const ModelViewContext = React.createContext(null);

export interface ModelViewContextValue {
    modelView: typeof ModelView;
}

type Props = {
    /**
     * Children to render
     */
    children: any;
    /**
     * ModelView class to make available in context
     */
    modelView: typeof ModelView;
};

/**
 * Provider for making a ModelView class available in context
 */
export default function ModelViewProvider(props: Props): React.ReactElement {
    const { children, modelView } = props;
    const providedContext = useMemo(
        () => ({
            modelView,
        }),
        [modelView]
    );
    return (
        <ModelViewContext.Provider value={providedContext}>{children}</ModelViewContext.Provider>
    );
}
