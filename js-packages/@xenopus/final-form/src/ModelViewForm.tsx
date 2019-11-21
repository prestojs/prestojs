import React from 'react';
import { ModelView } from '@xenopus/viewmodel';
import { Form, FormProps } from 'react-final-form';
import ModelViewFormField from './ModelViewFormField';

type ModelViewFormProps<FormValues = object> = FormProps<FormValues> & {
    initialValues?: FormValues | ModelView;
};

/**
 * Wrapper around react-final-form with some extensions
 *
 * 1) You can pass a record to `initialValues` and it will pass through the underlying data to the form
 *
 * 2) final-form expects a function as a child which you then render a <form> element with and pass through
 *    handleSubmit. Most the time this is the same thing so you optionally just pass through renderable
 *    children and the form will be created implicitly for you.
 */
export default function ModelViewForm({
    initialValues,
    children,
    ...rest
}: ModelViewFormProps): React.ReactElement {
    if (initialValues instanceof ModelView) {
        initialValues = initialValues.serializeToForm();
    }
    if (typeof children !== 'function') {
        const renderableChildren = children;
        children = ({ handleSubmit }): React.ReactElement => (
            <form onSubmit={handleSubmit}>{renderableChildren}</form>
        );
    }
    return (
        <Form {...rest} initialValues={initialValues}>
            {children}
        </Form>
    );
}

ModelViewForm.Field = ModelViewFormField;
