/**
 * Default formatter for RangeField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `RangeField` is [RangeFormatter](doc:RangeFormatter).
 *
 * You can pass options for the formatter via the `boundsField.formatterProps` prop.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import {
    CharField,
    DecimalRangeField,
    IntegerField,
    RangeField,
    viewModelFactory,
} from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        acceptedLevels: new RangeField({
            boundsField: new CharField({
                choices: [
                    ['level1', 'Level 1'],
                    ['level2', 'Level 2'],
                    ['level3', 'Level 3'],
                    ['level4', 'Level 4'],
                    ['level5', 'Level 5'],
                    ['level6', 'Level 6'],
                ],
            }),
        }),
        purchasePrice: new DecimalRangeField({
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
        acceptedLevels: { lower: 'level2', upper: 'level5' },
        purchasePrice: { lower: '100', upper: '200' },
    });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.acceptedLevels.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.acceptedLevels} />
                        </dd>
                        <dt>{ExampleModel.fields.purchasePrice.label}</dt>
                        <dd>
                            {' '}
                            <FieldFormatter field={record._f.purchasePrice} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
