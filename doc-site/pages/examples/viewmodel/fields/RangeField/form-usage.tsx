/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * The default widget is [RangeWidget](doc:RangeWidget).
 *
 * You can pass options for the widget via the `boundsField.widgetProps` option.
 *
 * @wide
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import {
    CharField,
    DecimalRangeField,
    IntegerField,
    RangeField,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { Button } from 'antd';
import 'antd/dist/antd.min.css';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        acceptedLevels: new RangeField({
            boundsField: new CharField({
                choices: [
                    ['level1', 'Level 1'],
                    ['level2', 'Level 2'],
                    ['level3', 'Level 3'],
                    ['level4', 'Level 4'],
                    ['level5', 'Level 5'],
                    ['level6', 'Level 6'],
                ],
                widgetProps: {
                    style: {
                        width: 100,
                    },
                },
            }),
        }),
        purchasePrice: new DecimalRangeField({
            boundsFieldProps: {
                formatterProps: {
                    locales: ['en-AU'],
                    localeOptions: { style: 'currency', currency: 'AUD' },
                },
            },
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
                        <Form.Item field={ExampleModel.fields.acceptedLevels} />
                        <Form.Item field={ExampleModel.fields.purchasePrice} />
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
