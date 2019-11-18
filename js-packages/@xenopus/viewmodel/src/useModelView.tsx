import { ModelViewContext, ModelViewContextValue } from './ModelViewProvider';
import { useContext } from 'react';

/**
 * Returns ModelView provided by parent ModelViewProvider component
 */
export default function useModelView(): ModelViewContextValue {
    const context = useContext(ModelViewContext);
    if (!context) {
        throw new Error('useModelView can only be used within a ModelViewProvider.');
    }
    return context;
}
