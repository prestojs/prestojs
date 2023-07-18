/**
 * Default formatter for TimeField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `TimeField` is [TimeFormatter](doc:TimeFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterProps`
 * option. These will be passed through to the formatter component.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { IntegerField, TimeField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        startTime: new TimeField({
            formatterProps: {
                locales: 'en-AU',
                localeOptions: {
                    timeStyle: 'medium',
                },
            },
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({ id: 1, startTime: '11:30' });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.startTime.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.startTime} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
