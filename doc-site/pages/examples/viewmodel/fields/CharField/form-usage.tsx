/**
 * Default widget in a Form
 *
 * This example shows the default widget that will be used in a [Form](doc:Form)
 * when using [@prestojs/ui-antd](/docs/ui-antd). See [getWidgetForField](doc:getWidgetForField).
 *
 * If `maxLength` is specified the widget will limit the length of entered text.
 *
 * @wide
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper } from '@prestojs/ui-antd';
import { CharField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import 'antd/dist/antd.min.css';
import React from 'react'; // TODO: in react18 you can just use `getWidgetForField` from '@prestojs/ui-antd' (just wrap below in React.Suspense)
import getWidgetForField from '../../../../../getWidgetForField';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        fullName: new CharField({
            maxLength: 10,
            helpText: 'Enter a name in 10 characters or less',
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
                    <Form.Item field={ExampleModel.fields.fullName} />
                </Form>
            </div>
        </AntdUiProvider>
    );
}
