/**
 * Default formatter for NumberField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `NumberField` is [NumberFormatter](doc:NumberFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterOptions`
 *  option. These will be passed through to the formatter component (eg. `locales` & `localeOptions`
 *  in this example).
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { IntegerField, NumberField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        capacity: new NumberField({
            formatterProps: {
                locales: ['en-AU'],
                localeOptions: { style: 'unit', unit: 'liter' },
            },
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({
        id: 1,
        capacity: 50,
    });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.capacity.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.capacity} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
