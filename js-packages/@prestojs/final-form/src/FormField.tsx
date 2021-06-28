import { FieldWidget } from '@prestojs/ui';
import { Field } from '@prestojs/viewmodel';
import React from 'react';
import { Field as FinalFormField, FieldProps } from 'react-final-form';

type FormFieldPropsWithField<T> = Omit<FieldProps<any, any>, 'name'> & {
    field: Field<T>;
    widgetProps?: Record<any, any>;
};

type FormFieldProps<T> = FieldProps<any, any> | FormFieldPropsWithField<T>;

/**
 * Wrapper around Field from react-final-form that determines the widget to use based on the field.
 *
 * Must be used within a `ViewModelForm`.
 *
 * If `component`, `render` or `children` are passed they will be used instead of selecting a widget
 * based on the field type.
 *
 * If `field` is passed through `defaultValue` will be populated unless otherwise specified. Note that
 * if the same field is specified in `initialValues` in [Form](doc:Form) then that takes precedence.
 *
 * @param field The [field](doc:Field) to get name, widget and default value from. If not specified you must provide one of
 * `component`, `children` or `render`.
 * @param widgetProps Optional props to pass through to the inferred widget. This is only used if `field` is provided
 * and none of `component`, `render` or `children` are provided.
 * @param name The name of the field. If not specified defaults to `field.name`. If `field` is not specified you must
 * provide this.
 * @param fieldProps Any other props to pass through to [Field](https://final-form.org/docs/react-final-form/api/Field)
 *
 * @rest-prop-name fieldProps
 * @extract-docs
 */
export default function FormField<T>({
    field,
    widgetProps,
    name,
    ...fieldProps
}: FormFieldProps<T>): React.ReactElement {
    const requireModelWidget = !fieldProps.component && !fieldProps.render && !fieldProps.children;
    if (!requireModelWidget && widgetProps) {
        // eslint-disable-next-line no-console
        console.warn(
            '`widgetProps` is only used if widget is inferred. Either remove it or remove the component/render/children prop. If you need to pass extra props on a custom widget use `render` and pass it through to your component directly.'
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
        if (fieldProps.defaultValue === undefined) {
            let { defaultValue } = field;
            if (
                defaultValue &&
                (typeof defaultValue === 'object' || typeof defaultValue === 'function') &&
                typeof defaultValue.then === 'function'
            ) {
                throw new Error('Promise support not yet implemented');
            }
            if (typeof defaultValue === 'function') {
                defaultValue = defaultValue();
            }
            fieldProps.defaultValue = defaultValue;
        }
        fieldProps.render = (props): React.ReactElement => (
            <FieldWidget field={field} {...props} {...widgetProps} />
        );
    }
    if (!name) {
        if (!field) {
            throw new Error("'name' or 'field' must be specified");
        }
        name = field.name;
    }
    return <FinalFormField name={name} {...fieldProps} />;
}
