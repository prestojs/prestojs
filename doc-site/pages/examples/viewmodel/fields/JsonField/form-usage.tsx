/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * The default widget is [JsonWidget](doc:JsonWidget). You can pass `format` and `parse` to the form field in
 * order to handle transforming value back and forth from a JSON string to it's parsed value.
 *
 * Any extra widget props can be defined at the field level in the `widgetProps` option (e.g. `rows` in the example
 * below).
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { IntegerField, JsonField, viewModelFactory } from '@prestojs/viewmodel';
import { Button } from 'antd';
import 'antd/dist/antd.min.css';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        data: new JsonField({
            helpText: 'Please enter your email address',
            widgetProps: { rows: 5 },
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({ id: 1, data: '{"name": "Gandalf"}' });
    return (
        <React.Suspense fallback="Loading...">
            <AntdUiProvider
                getWidgetForField={getWidgetForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <div className="grid grid-cols-1 gap-4 w-full">
                    <Form
                        onSubmit={({ data }) => console.log(ExampleModel.fields.data.parse(data))}
                        initialValues={{ data: ExampleModel.fields.data.format(record.data) }}
                    >
                        <Form.Item field={ExampleModel.fields.data} />
                        <Form.Item wrapperCol={{ offset: 6 }}>
                            <Button type="primary" htmlType="submit">
                                Submit (check console)
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </AntdUiProvider>
        </React.Suspense>
    );
}
