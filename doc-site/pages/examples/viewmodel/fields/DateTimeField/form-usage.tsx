/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * The default widget is [DateTimeWidget](doc:DateTimeWidget)
 *
 * Internally the Antd widget will use a third party date object like [Moment](https://momentjs.com/)
 * or [dayjs](https://day.js.org/). To support this you must specify `datePickerComponent` in the
 * [AntdUiProvider](doc:AntdUiProvider) usage.
 *
 * This example shows a setup using [dayjs](https://day.js.org/).
 *
 * Note that the output will be based on the date library you are using and so you may need
 * to transform the data to the expected format, eg. to a plain [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object:
 *
 * ```js
 * function transformData(data) {
 *     return {
 *         ...data,
 *         activatedAt: data.activatedAt.toDate()
 *     };
 * }
 * ```
 *
 * @wide
 * @min-height 320
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { DateField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
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
        activatedAt: new DateField(),
    },
    { pkFieldName: 'id' }
) {}

/**
 * Transform the `daysj` value into a plain `Date`.
 */
function transformData(data) {
    return {
        ...data,
        activatedAt: data.activatedAt?.toDate(),
    };
}

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
                    <Form onSubmit={data => console.log(transformData(data))}>
                        <Form.Item field={ExampleModel.fields.activatedAt} />
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
