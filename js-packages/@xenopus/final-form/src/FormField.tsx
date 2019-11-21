import React from 'react';
import { useUi } from '@xenopus/ui';
import { Field } from '@xenopus/viewmodel';
import { Field as FinalFormField, FieldProps } from 'react-final-form';

type ModelViewFormFieldProps<T> =
    | FieldProps<any, any>
    | (Omit<FieldProps<any, any>, 'name'> & { field: Field<T> });

/**
 * Wrapper around Field from react-final-form that determines the widget to use based on the field.
 *
 * Must be used within a `ModelViewForm`.
 *
 * If `component`, `render` or `children` are passed they will be used instead of selecting a widget
 * based on the field type.
 */
export default function FormField<T>({
    field,
    ...formProps
}: ModelViewFormFieldProps<T>): React.ReactElement {
    const { getWidgetForField } = useUi();
    const requireModelWidget = !formProps.component && !formProps.render && !formProps.children;
    if (requireModelWidget) {
        if (!field) {
            throw new Error(
                "You must specify one of 'component', 'children', 'render' or 'field'. " +
                    "ModelViewFormField works in one of two modes. If you specify 'component', 'render' or " +
                    "'children' then you control rendering entirely. Otherwise you can specify 'field' and " +
                    'the component to use will be inferred from the field type.'
            );
        }
        if (!formProps.name) {
            formProps.name = field.name;
        }
        formProps.component = getWidgetForField(field);
    }
    return <FinalFormField name={name} {...formProps} />;
}
