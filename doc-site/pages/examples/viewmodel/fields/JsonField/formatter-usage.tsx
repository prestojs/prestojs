/**
 * Default formatter for JsonField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * This just outputs the string exactly as entered.
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `JsonField` is [CharFormatter](doc:CharFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterOptions`
 * option.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { IntegerField, JsonField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        data: new JsonField(),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({ id: 1, data: '{"name": "Jo", "age": 22}' });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.data.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.data} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
