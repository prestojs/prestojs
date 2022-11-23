import { useUi } from '@prestojs/ui';
import React from 'react';
import { AnyObject, Form as FinalForm, FormProps as FinalFormProps } from 'react-final-form';
import FormField from './FormField';
import FormItem from './FormItem';

/**
 * @expand-properties Any of the final-form [FormProps](https://final-form.org/docs/react-final-form/types/FormProps) and the options shown below
 * @typeParam FormValues The type of values the form will submit
 * @typeParam FormComponentProps The type the wrapping form component accepts.
 */
export type FormProps<
    FormValues = AnyObject,
    FormComponentProps = Record<string, any>
> = FinalFormProps<FormValues> & {
    /**
     * Any extra props to pass through to the underlying form component. The form component
     * used is determined by the `formComponent` passed to [UiProvider](doc:UiProvider) or
     * `form` if none is passed.
     *
     * Note that this only applies if you pass `children` to `Form`. If you use `render` or `component`
     * then it is ignored.
     */
    formProps?: FormComponentProps;
};

/**
 * Wrapper around react-final-form with some extensions
 *
 * final-form expects a function as a child which you then render a `<form>` element with and pass through
 * handleSubmit. Most the time this is the same thing, so you optionally just pass through renderable
 * children and the form will be created implicitly for you.
 *
 * <Usage>
 *     Basic usage requires passing through `onSubmit` and then the children to render. Under the hood the
 *     children will be wrapped by `formComponent` that is returned by [useUi](doc:useUi) or `form` if none
 *     specified. You can use `formProps` to pass extra props through to the `formComponent`.
 *
 *     ```jsx
 *     <Form
 *        onSubmit={data => console.log(data)}
 *        formProps={{ id: 'my-form' }}
 *     >
 *        <Form.Item label="Name">
 *            <Form.Field name="name" component={CharWidget} />
 *        </Form.Item>
 *     </Form>
 *     ```
 *
 *     You can pass a function to children in which case you are responsible for rendering the wrapper:
 *
 *     ```jsx
 *     function Example() {
 *         const { formComponent: FormComponent = 'form' } = useUi();
 *
 *         return (
 *             <Form onSubmit={data => console.log(data)}>
 *                 {( { handleSubmit }) => (
 *                     <FormComponent onSubmit={handleSubmit} id="my-form" >
 *                         <Form.Item label="Name">
 *                             <Form.Field name="name" component={CharWidget} />
 *                         </Form.Item>
 *                     </FormComponent>
 *                 )}
 *             </Form>
 *         );
 *     }
 *     ```
 *
 *     <Alert>
 *         Your app must be wrapped in [UiProvider](doc:UiProvider) for it to work. This is used to determine
 *         what components to use for `Form` and [Form.Item](doc:FormItem).
 *
 *         See also [AntdUiProvider](doc:AntdUiProvider) for use with [ant design](https://ant.design).
 *     </Alert>
 * </Usage>
 *
 * @extract-docs
 */
export default function Form<FormValues = AnyObject, FormComponentProps = Record<string, any>>(
    props: FormProps<FormValues, FormComponentProps>
): React.ReactElement {
    let { children, formProps, ...rest } = props;
    let { formComponent: FormComponent } = useUi();
    if (!FormComponent) {
        FormComponent = 'form';
    }
    if (typeof children !== 'function') {
        const renderableChildren = children;
        children = ({ handleSubmit }): React.ReactElement => (
            <FormComponent onSubmit={handleSubmit} {...formProps}>
                {renderableChildren}
            </FormComponent>
        );
    }
    return <FinalForm {...rest}>{children}</FinalForm>;
}

Form.Field = FormField;
Form.Item = FormItem;
