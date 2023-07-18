/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * The default widget is [TimeWidget](doc:TimeWidget).
 *
 * To support this you must specify `timePickerComponent` in the [AntdUiProvider](doc:AntdUiProvider) usage. In this
 * example we use the default [TimePicker](https://4x.ant.design/components/time-picker/) component from Antd. This will
 * use a `DayJs` to represent the time. `transformData` is used to convert this to a string that could be sent to the
 * backend.
 *
 * @wide
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { IntegerField, TimeField, viewModelFactory } from '@prestojs/viewmodel';
import { Button, TimePicker } from 'antd';
import 'antd/dist/antd.min.css';
import React from 'react';

/**
 * Transform the `dayjs` value into a string
 */
function transformData(data) {
    return {
        ...data,
        startTime: data.startTime?.format('HH:mm:ss'),
    };
}

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        startTime: new TimeField(),
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
                timePickerComponent={TimePicker}
            >
                <div className="grid grid-cols-1 gap-4 w-full">
                    <Form onSubmit={data => console.log(transformData(data))}>
                        <Form.Item field={ExampleModel.fields.startTime} />
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
