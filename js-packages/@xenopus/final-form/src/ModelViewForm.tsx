import React from 'react';
import { ModelViewProvider, ModelView } from '@xenopus/viewmodel';
import { Form, FormProps } from 'react-final-form';
import ModelViewFormField from './ModelViewFormField';

type ModelViewFormProps = FormProps & { modelView: typeof ModelView };

export default function ModelViewForm({
    modelView,
    ...rest
}: ModelViewFormProps): React.ReactElement {
    return (
        <ModelViewProvider modelView={modelView}>
            <Form {...rest} />
        </ModelViewProvider>
    );
}

ModelViewForm.Field = ModelViewFormField;
