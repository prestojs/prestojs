import React, { useContext, useMemo } from 'react';
import { Field } from '@xenopus/viewmodel';
import FieldWidget from './FieldWidget';

export const UiContext = React.createContext(null);

type GetWidgetForField = <FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
) => FieldWidget<FieldValue, T> | null;

export interface FormItemProps {
    required: boolean;
    help?: React.ReactNode;
    label?: React.ReactNode;
}

export interface UiContextValue {
    getWidgetForField: GetWidgetForField;
    formItemComponent: React.ComponentType<FormItemProps>;
}

type Props = {
    /**
     * Children to render
     */
    children: any;
    /**
     * A function that is passed an instance of `Field` and should return the widget component to use
     * for this field. If falsey is returned then it will fall back to a parent UiProvider (if any) or if
     * no parent UiProvider an error will be thrown.
     *
     * @param field The specific field instance for a model
     */
    getWidgetForField?: GetWidgetForField;
    /**
     * A component to use to render items in a form. This is the component that will be rendered by
     * Form.Item.
     */
    formItemComponent?: React.ComponentType<FormItemProps>;
};

/**
 * Provider that allows you to define a function to return the form widget and
 * value formatter to use for a particular field.
 *
 * TODO: Add formatters, eg. getFormatterForField
 */
export default function UiProvider(props: Props): React.ReactElement {
    const { children, getWidgetForField, formItemComponent } = props;
    const context = useContext(UiContext);
    const { getWidgetForField: parentGetWidgetForField = null } = context || {};
    const providedContext = useMemo(
        () => ({
            formItemComponent,
            getWidgetForField<FieldValue, T extends HTMLElement>(
                field: Field<FieldValue>
            ): FieldWidget<FieldValue, T> | null {
                const widget = getWidgetForField(field);
                if (!widget) {
                    if (!parentGetWidgetForField) {
                        throw new Error(
                            `No widget provided for field ${field}. Update the 'getWidgetForField' function passed to UiProvider to handle this field.`
                        );
                    }
                    return parentGetWidgetForField(field);
                }
                return widget;
            },
        }),
        [formItemComponent, getWidgetForField, parentGetWidgetForField]
    );
    return <UiContext.Provider value={providedContext}>{children}</UiContext.Provider>;
}
