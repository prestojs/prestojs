import { useContext } from 'react';
import { TopLevelUiContextValue, UiContext } from './UiProvider';

/**
 * Returns getWidgetForField and getFormatterForField methods provided
 * by UiProvider
 *
 * @extract-docs
 */
export default function useUi(): TopLevelUiContextValue {
    const context = useContext(UiContext);
    if (!context) {
        throw new Error(
            'useUi can only be used within a UiProvider. Ensure your app is wrapped in a UiProvider instance.'
        );
    }
    // This is a workaround for the fact that we support nested context where we guarantee
    // at the top level getWidgetForField will either return a widget or throw an error.
    // We can't type this (to my knowledge) and so the getWidgetForField return type includes
    // a null value. To make consuming these types nicer TopLevelUiContextValue exists
    // which says getWidgetForField doesn't return null but that's not compatible with the
    // type of UiContext. As such we have to ignore the type error here.
    // Also see comments on type UiContextValue
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return context;
}
