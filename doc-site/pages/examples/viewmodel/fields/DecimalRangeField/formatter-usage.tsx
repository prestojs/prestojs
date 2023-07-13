/**
 * Default formatter for DecimalRangeField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `DecimalRangeField` is [DecimalRangeFormatter](doc:DecimalRangeFormatter).
 *
 * You can pass options for the formatter via the [DecimalField](doc:DecimalField) under the `boundsFieldProps.formatterProps`
 * option.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { DecimalRangeField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        decimalRange: new DecimalRangeField({
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

export default function FormatterUsage() {
    const record = new ExampleModel({
        id: 1,
        decimalRange: { lower: '100', upper: '999.99' },
    });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.decimalRange.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.decimalRange} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
