/**
 * Default formatter for DateField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 */
import { FieldFormatter, UiProvider } from '@prestojs/ui';
import { DateField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react'; // TODO: in react18 you can just use `getWidgetForField` from '@prestojs/ui-antd' (just wrap below in React.Suspense)
import getFormatterForField from '../../../../../getFormatterForField';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        activatedOn: new DateField(),
        deactivateOn: new DateField({
            label: 'Date deactivated',
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({
        id: 1,
        deactivateOn: '2022-01-10',
        activatedOn: new Date('2022-01-01'),
    });
    return (
        <UiProvider getFormatterForField={getFormatterForField}>
            <div className="grid grid-cols-1 gap-4 w-full">
                <dl>
                    <dt>{ExampleModel.fields.activatedOn.label}</dt>
                    <dd>
                        <FieldFormatter field={record._f.activatedOn} />
                    </dd>
                    <dt>{ExampleModel.fields.deactivateOn.label}</dt>
                    <dd>
                        {' '}
                        <FieldFormatter field={record._f.deactivateOn} />
                    </dd>
                </dl>
            </div>
        </UiProvider>
    );
}