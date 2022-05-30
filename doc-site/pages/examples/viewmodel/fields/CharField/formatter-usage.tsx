/**
 * Default formatter for CharField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * This just outputs the string exactly as entered.
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { CharField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        fullName: new CharField(),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({ id: 1, fullName: 'PrestoJS' });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.fullName.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.fullName} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
