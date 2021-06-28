import { ApiError } from '@prestojs/rest';
import { FieldWidget, useUi } from '@prestojs/ui';
import { Field, FieldProps, isViewModelInstance, ViewModelInterface } from '@prestojs/viewmodel';
import { ComponentType, createElement, ReactElement, ReactNode } from 'react';
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form';

type FormProps<FormValues = Record<string, any>> = {
    onSubmit: (...args: any[]) => any;
    /**
     * Initial values for the form. Either an object or a `ViewModel` record.
     */
    initialValues?: FormValues | ViewModelInterface<any, any>;
    /**
     * Any extra props to pass through to the underlying form component. The form component
     * used is determined by the `formComponent` passed to [UiProvider](doc:UiProvider) or
     * `form` if none is passed.
     *
     * Note that this only applies if you pass `children` to `Form`. If you use `render` or `component`
     * then it is ignored.
     */
    formProps?: Record<string, any>;
};

const FORM_ERROR_KEY = 'nonFieldErrors';

function Form<FormValues = Record<string, any>>(props: FormProps<FormValues>): ReactElement {
    const { initialValues, onSubmit, formProps, ...rest } = props;
    const methods = useForm({
        defaultValues: isViewModelInstance(initialValues)
            ? initialValues.serializeToForm()
            : initialValues,
    });
    const { setError, register, handleSubmit } = methods;
    const { formComponent: FormComponent = 'form' } = useUi();

    // This is required to be able to set form-level errors correctly, otherwise only the first dispatched submit
    // event is processed.
    register(FORM_ERROR_KEY);

    const processErrorResponse = (error: ApiError | TypeError): any => {
        if (!(error instanceof ApiError) || error.status === 500) {
            // eslint-disable-next-line no-console
            console.error(error);
            setError(FORM_ERROR_KEY, {
                type: 'apiError',
                message: 'There was an unexpected error. Please try again.',
            });
        } else {
            Object.entries(error.content).forEach(([fieldName, errorMessages]) => {
                const messages = Array.isArray(errorMessages) ? errorMessages : [errorMessages];

                setError(fieldName, { type: 'apiError', message: messages.join(' ') });
            });
        }
        return error;
    };

    const onSubmitWrapper: any = async data =>
        onSubmit(data).then(
            response => response,
            errorResponse => processErrorResponse(errorResponse)
        );

    return (
        <FormProvider {...methods}>
            <FormComponent onSubmit={handleSubmit(onSubmitWrapper)} {...formProps} {...rest} />
        </FormProvider>
    );
}

interface RenderableProps<T> {
    children?: ((props: T) => ReactNode) | ReactNode;
    component?: ComponentType<T>;
    render?: (props: T) => ReactNode;
}

interface FormFieldProps<FieldValueT> extends RenderableProps<any>, FieldProps<FieldValueT> {
    name?: string;
    field?: Field<FieldValueT>;
    widgetProps?: Record<any, any>;
    [fieldProp: string]: any;
}

function FormField<T>({
    field,
    widgetProps,
    name,
    ...fieldProps
}: FormFieldProps<T>): ReactElement {
    const { control } = useFormContext();
    const requireModelWidget = !fieldProps.component && !fieldProps.render && !fieldProps.children;
    if (!requireModelWidget && widgetProps) {
        // eslint-disable-next-line no-console
        console.warn(
            '`widgetProps` is only used if widget is inferred. Either remove it or remove the component/render/children prop. If you need to pass extra props on a custom widget use `render` and pass it through to your component directly.'
        );
    }
    if (requireModelWidget) {
        if (!field) {
            throw new Error(
                "You must specify one of 'component', 'children', 'render' or 'field'. " +
                    "Form.Field works in one of two modes. If you specify 'component', 'render' or " +
                    "'children' then you control rendering entirely. Otherwise you can specify 'field' and " +
                    'the component to use will be inferred from the field type.'
            );
        }
        if (fieldProps.defaultValue === undefined) {
            let { defaultValue } = field;

            if (
                defaultValue &&
                (typeof defaultValue === 'object' || typeof defaultValue === 'function') &&
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                typeof defaultValue.then === 'function'
            ) {
                throw new Error('Promise support not yet implemented');
            }
            if (typeof defaultValue === 'function') {
                defaultValue = defaultValue();
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            fieldProps.defaultValue = defaultValue;
        }
        // eslint-disable-next-line react/display-name
        fieldProps.render = (props): ReactElement => (
            <FieldWidget field={field} {...props} {...widgetProps} />
        );
    }
    if (!name) {
        if (!field) {
            throw new Error("'name' or 'field' must be specified");
        }
        name = field.name;
    }

    const { render, component, children, ...otherFieldProps } = fieldProps;

    return (
        <Controller
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            render={({ field: { ref, ...input } }): ReactElement => {
                if (render) {
                    return render({ input, ...otherFieldProps });
                }
                if (component) {
                    return createElement(component, { ...input, ...otherFieldProps }, children);
                }
                if (typeof children === 'function') {
                    return children({ input, ...otherFieldProps });
                }
                return children;
            }}
            name={name}
            control={control}
        />
    );
}

type CommonProps = {
    help?: ReactNode;
    label?: ReactNode;
    required?: boolean;
};

type FormItemPropsNoField = {
    field?: undefined;
    fieldProps?: undefined;
    widgetProps?: undefined;
    children: ReactNode;
} & CommonProps;

type FormItemPropsWithField<T> = {
    name?: undefined;
    field: Field<T>;
    fieldProps?: FormFieldProps<T>;
    widgetProps?: Record<any, any>;
    children?: ReactNode;
} & CommonProps;

type FormItemProps<T> = (FormItemPropsNoField | FormItemPropsWithField<T>) & {
    [formItemProp: string]: any;
};

function FormItem<T>(props: FormItemProps<T>): ReactElement {
    const { formItemComponent: InnerFormItem } = useUi();
    if (!InnerFormItem) {
        throw new Error(
            'formItemComponent must be specified in UiProvider in order to use FormItem'
        );
    }

    const { fieldProps, widgetProps, field, ...rest } = props;
    let { required, children } = rest;
    const extraProps: { help?: ReactNode; label?: ReactNode; fieldName?: string } = {};
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

    return (
        <InnerFormItem {...extraProps} {...rest} required={!!required}>
            {children}
        </InnerFormItem>
    );
}

export { Form, FORM_ERROR_KEY, FormField, FormItem };
