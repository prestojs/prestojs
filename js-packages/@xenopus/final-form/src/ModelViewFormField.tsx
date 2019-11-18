import React from 'react';
import { useUi } from '@xenopus/ui';
import { useModelView } from '@xenopus/viewmodel';
import { Field, FieldProps } from 'react-final-form';

type ModelViewFormFieldProps = FieldProps<any, any> & { name: string };

export default function ModelViewForm({
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
