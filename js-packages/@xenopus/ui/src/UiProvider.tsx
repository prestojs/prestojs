import React, { useContext, useMemo } from 'react';
import Field from '@xenopus/viewmodel/fields/Field';
import FieldWidget from './FieldWidget';

export const UiContext = React.createContext(null);

type ParentGetWidgetForField = <T>(field: Field<T>) => FieldWidget;
type GetWidgetForField = <T>(
    field: Field<T>,
    getParentWidget?: ParentGetWidgetForField
) => FieldWidget;

export interface UiContextValue {
    getWidgetForField: GetWidgetForField;
}

type Props = {
    /**
     * Children to render
     */
    children: any;
    /**
     * A function that is passed an instance of `Field` and an optional
     * second parameter which is any parent provider getWidgetForField method. This is useful
     * when nesting UiProvider - the second parameter can be used to get a default widget from
     * the parent provider.
     *
     * @param field The specific field instance for a model
     * @param getParentWidget If this UiProvider is nested in another this will be the getWidgetForField
     * method provided by the parent.
     */
    getWidgetForField: GetWidgetForField;
};

/**
 * Provider that allows you to define a function to return the form widget and
 * value formatter to use for a particular field.
 *
 *
 * TODO: Add formatters, eg. getFormatterForField
 */
export default function UiProvider(props: Props): React.ReactElement {
    const { children, getWidgetForField } = props;
    const context = useContext(UiContext);
    const { getWidgetForField: parentGetWidgetForField = null } = context || {};
    const providedContext = useMemo(
        () => ({
            getWidgetForField<T>(field: Field<T>): FieldWidget {
                return getWidgetForField(field, parentGetWidgetForField);
            },
        }),
        [parentGetWidgetForField, getWidgetForField]
    );
    return <UiContext.Provider value={providedContext}>{children}</UiContext.Provider>;
}
