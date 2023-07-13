/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * The default widget is [DateRangeWidget](doc:DateRangeWidget).
 *
 * You can pass options for the widget via the [DateField](doc:DateField) under the `boundsFieldProps.widgetProps`
 * option.
 *
 * @wide
 * @min-height 321
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { DateRangeField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import { Button } from 'antd';
import 'antd/dist/antd.min.css';
import generatePicker from 'antd/lib/date-picker/generatePicker';
import { Dayjs } from 'dayjs';

import dayjsGenerateConfig from 'rc-picker/lib/generate/dayjs';
import React from 'react';

const DatePicker = generatePicker<Dayjs>(dayjsGenerateConfig);

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        dateRange: new DateRangeField(),
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
                datePickerComponent={DatePicker}
            >
                <div className="grid grid-cols-1 gap-4 w-full">
                    <Form onSubmit={data => console.log(data)}>
                        <Form.Item field={ExampleModel.fields.dateRange} />
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
