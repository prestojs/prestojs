import React, { useContext, useMemo } from 'react';
import { Field } from '@xenopus/viewmodel';
import FieldWidget from './FieldWidget';

type GetWidgetForField = <FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
) => FieldWidget<FieldValue, T>;

type GetWidgetForFieldWithNull = <FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
) => FieldWidget<FieldValue, T> | null;

type GetFormatterForField = <FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
) => React.ComponentType<T> | string | null;

type GetFormatterForFieldWithNull = <FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
) => React.ComponentType<T> | string | null;

export interface FormItemProps {
    required: boolean;
    help?: React.ReactNode;
    label?: React.ReactNode;
}

export interface UiContextValue {
    // Technically if you use this at the top level then it will always return a widget
    // or throw an error. It's only when you use it nested within another provider that
    // it can return null. I don't know if it's possible to type that... So useUi is
    // typed to return TopLevelUiContextValue instead (see useUi for more)
    getWidgetForField: GetWidgetForFieldWithNull;
    getFormatterForField: GetFormatterForFieldWithNull;
    formItemComponent?: React.ComponentType<FormItemProps>;
}

export interface TopLevelUiContextValue {
    // See comments above on UiContextValue
    getWidgetForField: GetWidgetForField;
    getFormatterForField: GetFormatterForField;
    formItemComponent?: React.ComponentType<FormItemProps>;
}

export const UiContext = React.createContext<UiContextValue | null>(null);

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
    getWidgetForField?: GetWidgetForFieldWithNull;
    /**
     * A function that is passed an instance of `Field` and should return the widget component to use
     * for this field. If falsey is returned then it will fall back to a parent UiProvider (if any) or if
     * no parent UiProvider an error will be thrown.
     *
     * @param field The specific field instance for a model
     */
    getFormatterForField?: GetFormatterForFieldWithNull;
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
    const { children, getWidgetForField, getFormatterForField, formItemComponent } = props;
    const context = useContext(UiContext);
    const { getWidgetForField: parentGetWidgetForField = null } = context || {
        getWidgetForField: null,
    };
    const { getFormatterForField: parentGetFormatterForField = null } = context || {
        getFormatterForField: null,
    };
    const providedContext = useMemo(
        () => ({
            formItemComponent,
            getWidgetForField<FieldValue, T extends HTMLElement>(
                field: Field<FieldValue>
            ): FieldWidget<FieldValue, T> | null {
                let widget: FieldWidget<FieldValue, T> | null = null;
                if (getWidgetForField) {
                    widget = getWidgetForField(field);
                }
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
            getFormatterForField<FieldValue, T extends HTMLElement>(
                field: Field<FieldValue>
            ): React.ComponentType<T> | string | null {
                let formatter: React.ComponentType<T> | string | null = null;
                if (getFormatterForField) {
                    formatter = getFormatterForField(field);
                }
                if (!formatter) {
                    if (!parentGetFormatterForField) {
                        throw new Error(
                            `No formatter provided for field ${field}. Update the 'getFormatterForField' function passed to UiProvider to handle this field.`
                        );
                    }
                    return parentGetFormatterForField(field);
                }
                return formatter;
            },
        }),
        [
            formItemComponent,
            getWidgetForField,
            parentGetWidgetForField,
            getFormatterForField,
            parentGetFormatterForField,
        ]
    );
    return <UiContext.Provider value={providedContext}>{children}</UiContext.Provider>;
}
