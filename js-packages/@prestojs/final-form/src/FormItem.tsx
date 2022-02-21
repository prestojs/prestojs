import { useUi } from '@prestojs/ui';
import { Field } from '@prestojs/viewmodel';
import React from 'react';
import { FieldProps } from 'react-final-form';
import FormField from './FormField';

type CommonProps = {
    help?: React.ReactNode;
    label?: React.ReactNode;
    required?: boolean;
};

export type FormItemPropsNoField = {
    field?: undefined;
    fieldProps?: undefined;
    widgetProps?: undefined;
    children: React.ReactNode;
} & CommonProps;

export type FormItemPropsWithField<T> = {
    name?: undefined;
    field: Field<T>;
    fieldProps?: Omit<FieldProps<any, any>, 'name'>;
    widgetProps?: Record<any, any>;
    children?: React.ReactNode;
} & CommonProps;

export type FormItemProps<T> = (FormItemPropsNoField | FormItemPropsWithField<T>) & {
    [formItemProp: string]: any;
};

/**
 * Wrapper around Field from react-final-form that determines the widget to use based on the field.
 *
 * Must be used within a `ViewModelForm`.
 *
 * If `component`, `render` or `children` are passed they will be used instead of selecting a widget
 * based on the field type.
 *
 * Usage:
 *
 * ```js
 * // Fill out label, help text, required indicator and the field widget component to use based
 * // on the User email field
 * <Form.Item field={User.fields.email} />
 * // The equivalent thing writing out everything explicitly:
 * <Form.Item
 *     required={User.fields.email.required}
 *     label={User.fields.email.label}
 *     help={User.fields.email.help}
 * >
 *     <Form.Field field={User.fields.email} />
 * </Form.Item>
 * ```
 *
 * You can override any prop that is autofilled from the field:
 *
 * ```js
 * <Form.Item field={User.fields.email} label="Email Address" />
 * ```
 *
 * Or you can specify everything, including the field
 *
 * ```js
 * <Form.Item label="Email" help="Please double check your email">
 *     <Form.Field field={User.fields.email} />
 * </Form.Item>
 * ```
 *
 * @extract-docs
 */
export default function FormItem<T>(props: FormItemProps<T>): React.ReactElement {
    const { formItemComponent: InnerFormItem } = useUi();
    if (!InnerFormItem) {
        throw new Error(
            `formItemComponent must be specified in UiProvider in order to use Form.Item`
        );
    }
    const { fieldProps, widgetProps, field, ...rest } = props;
    let { required, children } = props;
    const extraProps: { help?: React.ReactNode; label?: React.ReactNode; fieldName?: string } = {};
    if (field) {
        extraProps.help = field.helpText;
        extraProps.label = field.label;
        extraProps.fieldName = field.name;

        if (required == null && field.blank !== undefined) {
            required = !field.blank;
        }
        if (!children) {
            children = <FormField {...fieldProps} widgetProps={widgetProps} field={field} />;
        }
    } else if (!children) {
        throw new Error("When 'field' is not specified you must provide children to render");
    }

    return <InnerFormItem {...extraProps} {...rest} required={!!required} children={children} />;
}
