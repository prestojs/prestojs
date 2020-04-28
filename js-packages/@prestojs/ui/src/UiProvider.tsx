import React, { useContext, useMemo } from 'react';
import { Field } from '@prestojs/viewmodel';
import { FieldWidgetType } from './FieldWidgetInterface';

type GetWidgetForField = <FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
) => FieldWidgetType<FieldValue, T>;

type GetWidgetForFieldWithNull = <FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
) => FieldWidgetType<FieldValue, T> | null;

type GetFormatterForField = <FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
) => string | React.ComponentType<T> | [React.ComponentType<T>, object];

type GetFormatterForFieldWithNull = <FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
) => string | React.ComponentType<T> | [React.ComponentType<T>, object] | null;

export interface FormItemProps {
    required: boolean;
    help?: React.ReactNode;
    label?: React.ReactNode;
}

export interface FormProps {
    onSubmit: (...args: any[]) => any;
}

export interface UiContextValue {
    // Technically if you use this at the top level then it will always return a widget
    // or throw an error. It's only when you use it nested within another provider that
    // it can return null. I don't know if it's possible to type that... So useUi is
    // typed to return TopLevelUiContextValue instead (see useUi for more)
    getWidgetForField: GetWidgetForFieldWithNull;
    getFormatterForField: GetFormatterForFieldWithNull;
    formItemComponent?: React.ComponentType<FormItemProps>;
    formComponent: string | React.ComponentType<FormProps>;
}

export interface TopLevelUiContextValue {
    // See comments above on UiContextValue
    getWidgetForField: GetWidgetForField;
    getFormatterForField: GetFormatterForField;
    formItemComponent?: React.ComponentType<FormItemProps>;
    formComponent: string | React.ComponentType<FormProps>;
}

export const UiContext = React.createContext<UiContextValue | null>(null);

/**
 * @expand-properties
 */
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
     * A function that is passed an instance of `Field` and should return the formatter to use
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
    /**
     * A component to use to render the form. This is the component that will be rendered by
     * Form. Defaults to `form`.
     */
    formComponent?: React.ComponentType<any>;
};

/**
 * UiProvider is used to supply the UI library specific widgets, formatters, form components etc that are used
 * throughout the system.
 *
 * For example to use with ui-antd (install `@prestojs/ui-antd` and `antd`):
 *
 * ```jsx
 * import React from 'react';
 * import { UiProvider } from '@prestojs/ui';
 * import { Input } from 'antd';
 * import {
 *   FormWrapper,
 *   getWidgetForField as antdGetWidgetForField,
 *   FormItemWrapper,
 * } from '@prestojs/ui-antd';
 *
 * const DefaultWidget = ({ input }) => <Input {...input} />;
 *
 * function getWidgetForField(field) {
 *   const widget = antdGetWidgetForField(field);
 *   // If ui-antd doesn't provide a widget fall back to a default
 *   // You can add your own customisations here too (eg. override widgets
 *   // for specific fields or add support for new fields)
 *   if (!widget) {
 *     return DefaultWidget;
 *   }
 *   return widget;
 * }
 *
 * export default function Root() {
 *   return (
 *     <UiProvider
 *       getWidgetForField={getWidgetForField}
 *       formItemComponent={FormItemWrapper}
 *       formComponent={FormWrapper}
 *     >
 *        <YourApp />
 *     </UiProvider>
 *   );
 * }
 * ```
 *
 * @extract-docs
 */
export default function UiProvider(props: Props): React.ReactElement {
    const {
        children,
        getWidgetForField,
        getFormatterForField,
        formItemComponent,
        formComponent = 'form',
    } = props;
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
            formComponent,
            getWidgetForField<FieldValue, T extends HTMLElement>(
                field: Field<FieldValue>
            ): FieldWidgetType<FieldValue, T> | null {
                let widget: FieldWidgetType<FieldValue, T> | null = null;
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
            ): string | React.ComponentType<T> | [React.ComponentType<T>, object] | null {
                let formatter:
                    | string
                    | React.ComponentType<T>
                    | [React.ComponentType<T>, object]
                    | null = null;
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
            formComponent,
            getWidgetForField,
            parentGetWidgetForField,
            getFormatterForField,
            parentGetFormatterForField,
        ]
    );
    return <UiContext.Provider value={providedContext}>{children}</UiContext.Provider>;
}
