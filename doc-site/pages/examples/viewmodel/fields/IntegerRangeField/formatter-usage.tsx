/**
 * Default formatter for IntegerRangeField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `IntegerRangeField` is [IntegerRangeFormatter](doc:IntegerRangeFormatter).
 *
 * You can pass options for the formatter via the [IntegerField](doc:IntegerField) under the `boundsFieldProps.formatterProps`
 * option.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { IntegerField, IntegerRangeField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        capacity: new IntegerRangeField({
            boundsFieldProps: {
                formatterProps: {
                    locales: ['en-AU'],
                    localeOptions: {
                        style: 'unit',
                        unit: 'liter',
                    },
                },
            },
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormatterUsage() {
    const record = new ExampleModel({
        id: 1,
        capacity: { lower: 10, upper: 100 },
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
