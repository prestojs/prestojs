import { Field } from '@prestojs/viewmodel';
import React, { useContext, useMemo } from 'react';
import { FieldWidgetType } from './FieldWidgetInterface';

interface FormatterComponentProps<ValueT> {
    value?: ValueT;
}

/**
 * A formatter component definition is either a regular component or a 2-element array where
 * the first element is the component function and the second are the props that should be passed
 * to that component.
 */
export type FormatterComponentDefinition<ValueT = any> =
    | string
    | React.ComponentType<FormatterComponentProps<ValueT>>
    | [React.ComponentType<FormatterComponentProps<ValueT>> | string, Record<string, unknown>];

type GetWidgetForField = <FieldValueT, ParsableValueT, SingleValueT, T extends HTMLElement>(
    field: Field<FieldValueT, ParsableValueT, SingleValueT>
) => FieldWidgetType<FieldValueT, T> | [FieldWidgetType<FieldValueT, T>, Record<string, unknown>];

type GetWidgetForFieldWithNull = <FieldValueT, ParsableValueT, SingleValueT, T extends HTMLElement>(
    field: Field<FieldValueT, ParsableValueT, SingleValueT>
) =>
    | FieldWidgetType<FieldValueT, T>
    | [FieldWidgetType<FieldValueT, T>, Record<string, unknown>]
    | null;

type GetFormatterForField = <FieldValueT, ParsableValueT, SingleValueT>(
    field: Field<FieldValueT, ParsableValueT, SingleValueT>
) => FormatterComponentDefinition;

type GetFormatterForFieldWithNull = <FieldValueT, ParsableValueT, SingleValueT>(
    field: Field<FieldValueT, ParsableValueT, SingleValueT>
) => FormatterComponentDefinition | null;

export interface FormItemProps {
    children: React.ReactNode;
    required: boolean;
    help?: React.ReactNode;
    label?: React.ReactNode;
    // Field name, if known. This is only applicable when a field has been passed through
    // to a FormItem.
    fieldName?: string;
    // Any other props
    [x: string]: any;
}

export interface FormProps {
    onSubmit: (...args: any[]) => any;
    children: React.ReactNode;
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
export type UiProviderProps = {
    /**
     * Children to render
     */
    children: any;
    /**
     * A function that is passed an instance of `Field` and should return the widget component to use
     * for this field. If falsey is returned then it will fall back to a parent UiProvider (if any) or if
     * no parent UiProvider an error will be thrown.
     *
     * This function can return a 2-tuple of the form [component, props] where props is an object of
     * any extra props to pass through to the component. It is recommended you include `field.getWidgetProps()`, eg.
     *
     * ```
     * if (field instanceof BooleanField) {
     *    return [CustomBooleanWidget, field.getWidgetProps()];
     * }
     * ```
     *
     * This allows [Field](doc:Field) definitions to supply extra props the widget can use.
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
 * To use with `@prestojs/ui-antd` see [AntdUiProvider](doc:AntdUiProvider).
 *
 * ```jsx
 * import React from 'react';
 * import { UiProvider, getFormatterForField } from '@prestojs/ui';
 * import { Input } from 'antd';
 *
 * const DefaultWidget = ({ input }) => <input {...input} />;
 * const DefaultFormatter = ({ value }) => value;
 *
 * function getWidgetForField(field) {
 *    // Add any app specific customisations here, eg
 *    // if (field instanceof BooleanField) {
 *    //    return [CustomBooleanWidget, field.getWidgetProps()];
 *    // }
 *    // Otherwise return default widget. If you would prefer an error if no explicit widget defined for
 *    // a field then don't return anything.
 *    return [DefaultWidget, field.getWidgetProps()];
 * }
 *
 * function getFormatterForField(field) {
 *     // Add any app specific customisations here, eg
 *     // if (field instanceof BooleanField) {
 *     //    return CustomBooleanFormatter;
 *     // }
 *     return DefaultFormatter;
 * }
 *
 * function FormItemWrapper({ children, label, help, required }) {
 *     return (
 *         <div>
 *             <label>
 *                 {label} {children}
 *             </label>
 *             {required ? '(required)' : '(optional)'}
 *             {help && <span className="help">{help}</span>}
 *         </div>
 *     );
 * }
 *
 * export default function Root() {
 *   return (
 *     <UiProvider
 *       getFormatterForField={getFormatterForField}
 *       getWidgetForField={getWidgetForField}
 *       formItemComponent={FormItemWrapper}
 *     >
 *        <YourApp />
 *     </UiProvider>
 *   );
 * }
 * ```
 *
 * @extract-docs
 */
export default function UiProvider(props: UiProviderProps): React.ReactElement {
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
            getWidgetForField<FieldValueT, ParsableValueT, SingleValueT, T extends HTMLElement>(
                field: Field<FieldValueT, ParsableValueT, SingleValueT>
            ):
                | FieldWidgetType<FieldValueT, T>
                | [FieldWidgetType<FieldValueT, T>, Record<string, unknown>]
                | null {
                let widget:
                    | FieldWidgetType<FieldValueT, T>
                    | [FieldWidgetType<FieldValueT, T>, Record<string, unknown>]
                    | null = null;
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
            getFormatterForField<FieldValueT, ParsableValueT, SingleValueT>(
                field: Field<FieldValueT, ParsableValueT, SingleValueT>
            ):
                | string
                | React.ComponentType<FormatterComponentProps<FieldValueT>>
                | [
                      React.ComponentType<FormatterComponentProps<FieldValueT>> | string,
                      Record<string, unknown>
                  ]
                | null {
                let formatter:
                    | string
                    | React.ComponentType<FormatterComponentProps<FieldValueT>>
                    | [
                          React.ComponentType<FormatterComponentProps<FieldValueT>> | string,
                          Record<string, unknown>
                      ]
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
