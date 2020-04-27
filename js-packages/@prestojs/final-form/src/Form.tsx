import { useUi } from '@prestojs/ui';
import React from 'react';
import { isViewModelInstance } from '@prestojs/viewmodel';
import { ViewModelInterface } from '@prestojs/viewmodel/ViewModelFactory';
import { Form as FinalForm, FormProps as FinalFormProps } from 'react-final-form';
import FormField from './FormField';
import FormItem from './FormItem';

/**
 * @expand-properties Any of the final-form [FormProps](https://final-form.org/docs/react-final-form/types/FormProps) and the options shown below
 */
type FormProps<FormValues = object> = FinalFormProps<FormValues> & {
    /**
     * Initial values for the form. Either an object or a `ViewModel` record.
     */
    initialValues?: FormValues | ViewModelInterface<any, any>;
    /**
     * Any extra props to pass through to the underlying form component. The form component
     * used is determined by the `formComponent` passed to [UiProvider](doc:UiProvider) or
     * `form` if none is passed.
     */
    formProps?: Record<string, any>;
};

/**
 * Wrapper around react-final-form with some extensions
 *
 * 1) You can pass a record to `initialValues` and it will pass through the underlying data to the form
 *
 * 2) final-form expects a function as a child which you then render a `<form>` element with and pass through
 *    handleSubmit. Most the time this is the same thing so you optionally just pass through renderable
 *    children and the form will be created implicitly for you.
 *
 * @extract-docs
 */
export default function Form(props: FormProps): React.ReactElement {
    let { initialValues, children, formProps, ...rest } = props;
    let { formComponent: FormComponent } = useUi();
    if (!FormComponent) {
        FormComponent = 'form';
    }
    if (isViewModelInstance(initialValues)) {
        initialValues = initialValues.serializeToForm();
    }
    if (typeof children !== 'function') {
        const renderableChildren = children;
        children = ({ handleSubmit }): React.ReactElement => (
            <FormComponent onSubmit={handleSubmit} {...formProps}>
                {renderableChildren}
            </FormComponent>
        );
    }
    return (
        <FinalForm {...rest} initialValues={initialValues}>
            {children}
        </FinalForm>
    );
}

Form.Field = FormField;
Form.Item = FormItem;
