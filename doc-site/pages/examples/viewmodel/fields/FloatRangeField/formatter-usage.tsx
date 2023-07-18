/**
 * Default formatter for FloatRangeField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `FloatRangeField` is [RangeFormatter](doc:RangeFormatter).
 *
 * You can pass options for the formatter via the [FloatField](doc:FloatField) under the `boundsFieldProps.formatterProps`
 * option.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { FloatField, FloatRangeField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new FloatField(),
        capacity: new FloatRangeField({
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
        capacity: { lower: 1.1, upper: 5.4 },
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
