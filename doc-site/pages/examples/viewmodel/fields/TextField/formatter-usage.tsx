/**
 * Default formatter for TextField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * This just outputs the string exactly as entered.
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `TextField` is [CharFormatter](doc:CharFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterProps`
 * option. These will be passed through to the formatter component (eg. `blankLabel` in this example).
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { IntegerField, TextField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        fullName: new TextField(),
        address: new TextField({ formatterProps: { blankLabel: <em>Not supplied</em> } }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({ id: 1, fullName: 'PrestoJS', address: '' });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.fullName.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.fullName} />
                        </dd>
                        <dt>{ExampleModel.fields.address.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.address} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
