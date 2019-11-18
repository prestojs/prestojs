import { useContext } from 'react';
import { UiContext, UiContextValue } from './UiProvider';

/**
 * Returns getWidgetForField and getFormatterForField methods provided
 * by UiProvider
 */
export default function useUi(): UiContextValue {
    const context = useContext(UiContext);
    if (!context) {
        throw new Error(
            'useUi can only be used within a UiProvider. Ensure your app is wrapped in a UiProvider instance.'
        );
    }
    return context;
}
