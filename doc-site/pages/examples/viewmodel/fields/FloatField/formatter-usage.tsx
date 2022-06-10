/**
 * Default formatter for FloatField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `FloatField` is [NumberFormatter](doc:NumberFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterOptions`
 *  option. These will be passed through to the formatter component (eg. `locales` & `localeOptions`
 *  in this example).
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { FloatField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        discount: new FloatField({
            formatterProps: {
                locales: ['en-AU'],
                localeOptions: { style: 'percent' },
            },
        }),
        total: new FloatField({
            label: 'Total Amount',
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({
        id: 1,
        discount: 0.5,
        total: 1000.358,
    });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.discount.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.discount} />
                        </dd>
                        <dt>{ExampleModel.fields.total.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.total} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
