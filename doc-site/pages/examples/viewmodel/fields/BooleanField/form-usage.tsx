/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * `final-form` expects to be told when a field is a checkbox so it knows how to
 * handle undefined values. This example demonstrates this with the [Form.Item](doc:FormItem)
 * component.
 *
 * @wide
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper } from '@prestojs/ui-antd';
import { BooleanField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import { Button } from 'antd';
import 'antd/dist/antd.min.css';
import React from 'react'; // TODO: in react18 you can just use `getWidgetForField` from '@prestojs/ui-antd' (just wrap below in React.Suspense)
import getWidgetForField from '../../../../../getWidgetForField';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        isActive: new BooleanField(),
        receiveNewsletter: new BooleanField({
            label: 'Subscribe to newsletter',
            helpText: 'Check this to subscribe to our newsletter',
        }),
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
                <Form onSubmit={data => console.log(data)}>
                    <Form.Item
                        field={ExampleModel.fields.isActive}
                        fieldProps={{ type: 'checkbox' }}
                    />
                    <Form.Item
                        field={ExampleModel.fields.receiveNewsletter}
                        fieldProps={{ type: 'checkbox' }}
                    />
                    <Form.Item wrapperCol={{ offset: 6 }}>
                        <Button type="primary" htmlType="submit">
                            Submit (check console)
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </AntdUiProvider>
    );
}
