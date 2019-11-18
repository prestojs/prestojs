import React from 'react';
import { ModelViewProvider, ModelView } from '@xenopus/viewmodel';
import { Form, FormProps } from 'react-final-form';
import ModelViewFormField from './ModelViewFormField';

type ModelViewFormProps = FormProps & { modelView: typeof ModelView };

/**
 * Wrapper around Form from react-final-form that allows you to use ModelViewForm.Field within it to
 * automatically determine the widget to use.
 *
 * TODO: Interface likely to change; expand this once settled
 */
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
