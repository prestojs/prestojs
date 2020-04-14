import React from 'react';
import { FieldWidget } from '@prestojs/ui';
import { Field } from '@prestojs/viewmodel';
import { Field as FinalFormField, FieldProps } from 'react-final-form';

type FormFieldProps<T> =
    | FieldProps<any, any>
    | (Omit<FieldProps<any, any>, 'name'> & { field: Field<T>; widgetProps?: Record<any, any> });

/**
 * Wrapper around Field from react-final-form that determines the widget to use based on the field.
 *
 * Must be used within a `ViewModelForm`.
 *
 * If `component`, `render` or `children` are passed they will be used instead of selecting a widget
 * based on the field type.
 *
 * @extract-docs
 */
export default function FormField<T>({
    field,
    widgetProps,
    ...formProps
}: FormFieldProps<T>): React.ReactElement {
    const requireModelWidget = !formProps.component && !formProps.render && !formProps.children;
    if (requireModelWidget && widgetProps) {
        // eslint-disable-next-line no-console
        console.warn(
            '`widgetProps` is only used if widget is inferred. Either remove it or remove the component/render/children prop.'
        );
    }
    if (requireModelWidget) {
        if (!field) {
            throw new Error(
                "You must specify one of 'component', 'children', 'render' or 'field'. " +
                    "Form.Field works in one of two modes. If you specify 'component', 'render' or " +
                    "'children' then you control rendering entirely. Otherwise you can specify 'field' and " +
                    'the component to use will be inferred from the field type.'
            );
        }
        if (!formProps.name) {
            formProps.name = field.name;
        }
        formProps.render = (props): React.ReactElement => (
            <FieldWidget field={field} {...props} {...widgetProps} />
        );
    }
    return <FinalFormField name={name} {...formProps} />;
}
