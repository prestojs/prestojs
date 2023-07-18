/**
 * Default formatter for DateRangeField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `DateRangeField` is [RangeFormatter](doc:RangeFormatter).
 *
 * You can pass options for the formatter via the [DateField](doc:DateField) under the `boundsFieldProps.formatterProps`
 * option.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { DateRangeField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        dateRange: new DateRangeField(),
    },
    { pkFieldName: 'id' }
) {}

export default function FormatterUsage() {
    const record = new ExampleModel({
        id: 1,
        dateRange: { lower: new Date('2023-05-01'), upper: new Date() },
    });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.dateRange.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.dateRange} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
