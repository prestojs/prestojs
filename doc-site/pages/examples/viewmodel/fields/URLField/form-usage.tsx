/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * The default widget is [CharWidget](doc:CharWidget)
 *
 * If `maxLength` is specified the widget will limit the length of entered URL.
 *
 * Any extra widget props can be defined at the field level in the `widgetProps` option.
 *
 * @wide
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { CharField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import { Button } from 'antd';
import 'antd/dist/antd.min.css';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        url: new CharField({
            helpText: 'Enter the URL',
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    return (
        <React.Suspense fallback="Loading...">
            <AntdUiProvider
                getWidgetForField={getWidgetForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <div className="grid grid-cols-1 gap-4 w-full">
                    <Form onSubmit={data => console.log(data)}>
                        <Form.Item field={ExampleModel.fields.url} />
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
