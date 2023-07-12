import { useUi } from '@prestojs/ui';
import { Field } from '@prestojs/viewmodel';
import React from 'react';
import { FieldProps } from 'react-final-form';
import FormField from './FormField';

/**
 * @expandproperties
 */
export type FormItemCommonProps = {
    /**
     * Any help text to display below the field.
     *
     * This will be inferred from the [Field](doc:Field) if not specified.
     *
     * This can be any React node.
     */
    help?: React.ReactNode;
    /**
     * The label for the field.
     *
     * This will be inferred from the [Field](doc:Field) if not specified.
     */
    label?: React.ReactNode;
    /**
     * Whether the field is required or not.
     *
     * This will be inferred from the [Field](doc:Field) if not specified.
     */
    required?: boolean;
};

/**
 * @expandproperties
 * @hideproperties field widgetProps fieldProps
 */
export type FormItemPropsNoField = {
    field?: undefined;
    fieldProps?: undefined;
    widgetProps?: undefined;
    /**
     * If specified, this will be rendered in place of any inferred widget.
     */
    children: React.ReactNode;
} & FormItemCommonProps;

/**
 * @expandproperties
 * @hideproperties name
 */
export type FormItemPropsWithField<T> = {
    name?: undefined;
    /**
     * The ViewModel [Field](doc:Field) that defaults can be inferred from. Passing this allows
     * the widget, help text, required state and label to be inferred from the field.
     */
    field: Field<T>;
    /**
     * Any props to pass through to the [FormField](doc:FormField) component.
     *
     * @typename FieldProps
     */
    fieldProps?: Omit<FieldProps<any, any>, 'name'>;
    /**
     * Any props to pass through to the underlying field widget itself
     */
    widgetProps?: Record<any, any>;
    children?: React.ReactNode;
} & FormItemCommonProps;

/**
 * @expandproperties
 */
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
 * ```
 *
 * The equivalent thing writing out everything explicitly:
 *
 * ```js
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
 * @extractdocs
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
