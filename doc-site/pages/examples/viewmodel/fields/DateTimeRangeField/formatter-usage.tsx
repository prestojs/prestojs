/**
 * Default formatter for DateTimeRangeField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `DateTimeRangeField` is [RangeFormatter](doc:RangeFormatter).
 *
 * You can pass options for the formatter via the [DateTimeField](doc:DateTimeField) under the `boundsFieldProps.formatterProps`
 * option.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { DateTimeRangeField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        dateTimeRange: new DateTimeRangeField(),
    },
    { pkFieldName: 'id' }
) {}

export default function FormatterUsage() {
    const record = new ExampleModel({
        id: 1,
        dateTimeRange: { lower: new Date('2023-05-01'), upper: new Date() },
    });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.dateTimeRange.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.dateTimeRange} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
