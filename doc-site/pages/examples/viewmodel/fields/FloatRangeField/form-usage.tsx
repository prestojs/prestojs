/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * The default widget is [FloatRangeWidget](doc:FloatRangeWidget).
 *
 * You can pass options for the widget via the [FloatField](doc:FloatField) under the `boundsFieldProps.widgetProps`
 * option.
 *
 * @wide
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { FloatField, FloatRangeField, viewModelFactory } from '@prestojs/viewmodel';
import { Button } from 'antd';
import 'antd/dist/antd.min.css';

import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new FloatField(),
        floatRange: new FloatRangeField(),
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
                        <Form.Item field={ExampleModel.fields.floatRange} />
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
