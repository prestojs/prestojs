/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * `final-form` expects to be told when a field is a checkbox so it knows how to
 * handle undefined values. This example demonstrates this with the [Form.Item](doc:FormItem)
 * component.
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { BooleanField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import 'antd/dist/antd.min.css';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        isActive: new BooleanField(),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    return (
        <AntdUiProvider
            getWidgetForField={getWidgetForField}
            formItemComponent={FormItemWrapper}
            formComponent={FormWrapper}
        >
            <div className="grid grid-cols-1 gap-4 w-full">
                <React.Suspense fallback={null}>
                    <Form onSubmit={data => console.log(data)}>
                        <Form.Item
                            field={ExampleModel.fields.isActive}
                            fieldProps={{ type: 'checkbox' }}
                        />
                    </Form>
                </React.Suspense>
            </div>
        </AntdUiProvider>
    );
}
