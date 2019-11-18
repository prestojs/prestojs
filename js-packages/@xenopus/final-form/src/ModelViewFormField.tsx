import React from 'react';
import { useUi } from '@xenopus/ui';
import { useModelView } from '@xenopus/viewmodel';
import { Field, FieldProps } from 'react-final-form';

type ModelViewFormFieldProps = FieldProps<any, any> & { name: string };

/**
 * Wrapper around Field from react-final-form that determines the widget to use based on the field.
 *
 * Must be used within a `ModelViewForm`.
 *
 * If `component`, `render` or `children` are passed they will be used instead of selecting a widget
 * based on the field type.
 */
export default function ModelViewFormField({
    name,
    ...formProps
}: ModelViewFormFieldProps): React.ReactElement {
    const { modelView } = useModelView();
    const { getWidgetForField } = useUi();
    const requireModelWidget = !formProps.component && !formProps.render && !formProps.children;
    if (requireModelWidget) {
        const field = modelView._fields[name];
        if (!field) {
            throw new Error(
                `Field ${name} not found on model ${modelView}. Known fields are: ${Object.keys(
                    modelView._fields
                ).join(', ')}`
            );
        }
        formProps.component = getWidgetForField(field);
    }
    return <Field name={name} {...formProps} />;
}
