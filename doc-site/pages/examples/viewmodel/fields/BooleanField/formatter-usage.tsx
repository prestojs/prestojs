/**
 * Default formatter for BooleanField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 */
import { FieldFormatter, UiProvider } from '@prestojs/ui';
import { BooleanField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react'; // TODO: in react18 you can just use `getWidgetForField` from '@prestojs/ui-antd' (just wrap below in React.Suspense)
import getFormatterForField from '../../../../../getFormatterForField';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        isActive: new BooleanField(),
        receiveNewsletter: new BooleanField({
            label: 'Subscribe to newsletter',
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({ id: 1, isActive: true, receiveNewsletter: false });
    return (
        <UiProvider getFormatterForField={getFormatterForField}>
            <div className="grid grid-cols-1 gap-4 w-full">
                <dl>
                    <dt>{ExampleModel.fields.isActive.label}</dt>
                    <dd>
                        <FieldFormatter field={record._f.isActive} />
                    </dd>
                    <dt>{ExampleModel.fields.receiveNewsletter.label}</dt>
                    <dd>
                        {' '}
                        <FieldFormatter field={record._f.receiveNewsletter} />
                    </dd>
                </dl>
            </div>
        </UiProvider>
    );
}
