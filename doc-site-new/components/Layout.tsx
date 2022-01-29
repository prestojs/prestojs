import { FunctionSignature } from '@prestojs/doc';
import { Form } from '@prestojs/final-form';
import FormItem from '@prestojs/final-form/FormItem';
import { UiProvider } from '@prestojs/ui';
import FormItemWrapper from '@prestojs/ui-antd/FormItemWrapper';
import FormWrapper from '@prestojs/ui-antd/FormWrapper';
import { CharField, Field, viewModelFactory } from '@prestojs/viewmodel';
import Head from 'next/head';
import React, { ReactNode } from 'react';
import getFormatterForField from '../getFormatterForField';
import getWidgetForField from '../getWidgetForField';

console.log({
    FormItemWrapper,
    FormWrapper,
});

const User = viewModelFactory(
    {
        id: new Field<any>(),
        firstName: new CharField(),
    },
    { pkFieldName: 'id' }
);

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <Head>
                <title>Presto</title>
            </Head>
            <UiProvider
                getWidgetForField={getWidgetForField}
                getFormatterForField={getFormatterForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <div className="w-full max-w-screen-2xl mx-auto px-6">
                    <div className="lg:flex -mx-6">
                        <Form onSubmit={() => console.log('asdf')}>
                            <FormItem field={User.fields.firstName} />
                            umm
                            <FunctionSignature />
                        </Form>
                        {children}
                        <footer className="bg-red-100">© {new Date().getFullYear()}</footer>
                    </div>
                </div>
                {}
            </UiProvider>
        </>
    );
}
