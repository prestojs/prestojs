/**
 * Format ViewModel Fields
 *
 * This example shows how [FieldFormatter](doc:FieldFormatter) can be used to format range
 * fields, optionally customising the props passed to each formatter. This can be done
 * via the field definition itself, or via the `boundsFormatterProps` prop passed to
 * `FieldFormatter`.
 *
 * The default [getFormatterForField](doc:getFormatterForField) will select the appropriate
 * `boundsFormatter` based on the type. For example, [DateRangeField](doc:DateRangeField)
 * will use the [DateFormatter](doc:DateFormatter).
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import {
    CharField,
    DateRangeField,
    DecimalRangeField,
    IntegerField,
    IntegerRangeField,
    RangeField,
    viewModelFactory,
} from '@prestojs/viewmodel';
import React from 'react';

class Filter extends viewModelFactory(
    {
        id: new IntegerField(),
        purchasedAt: new DateRangeField(),
        purchasePrice: new DecimalRangeField({
            boundsFieldProps: {
                formatterProps: {
                    locales: ['en-AU'],
                    localeOptions: { style: 'currency', currency: 'AUD' },
                },
            },
        }),
        size: new IntegerRangeField({
            boundsFieldProps: {
                choices: [
                    [1, 'XS'],
                    [2, 'S'],
                    [3, 'M'],
                    [4, 'L'],
                    [5, 'XL'],
                    [6, 'XXL'],
                ],
            },
            formatterProps: { separator: 'to' },
        }),
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
        level: new RangeField({
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
    },
    { pkFieldName: 'id' }
) {}

export default function ViewmodelFields() {
    const filter = new Filter({
        id: 1,
        purchasedAt: { lower: new Date('2023-03-04'), upper: new Date() },
        size: { lower: 1, upper: 4 },
        purchasePrice: { lower: '0', upper: '99' },
        capacity: { lower: 10, upper: 100 },
        level: { lower: 'level1', upper: 'level3' },
    });
    return (
        <UiProvider getFormatterForField={getFormatterForField}>
            <dl>
                <dt>Dates</dt>
                <dd>
                    <FieldFormatter
                        field={filter._f.purchasedAt}
                        boundsFormatterProps={{
                            localeOptions: {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            },
                        }}
                    />
                </dd>
                <dt>Price</dt>
                <dd>
                    <FieldFormatter field={filter._f.purchasePrice} />
                </dd>
                <dt>Sizes</dt>
                <dd>
                    <FieldFormatter field={filter._f.size} />
                </dd>
                <dt>Capacity</dt>
                <dd>
                    <FieldFormatter field={filter._f.capacity} />
                </dd>
                <dt>Level</dt>
                <dd>
                    <FieldFormatter field={filter._f.level} />
                </dd>
            </dl>
        </UiProvider>
    );
}
