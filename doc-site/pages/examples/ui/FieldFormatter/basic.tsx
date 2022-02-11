import { FieldFormatter, NumberFormatter, UiProvider } from '@prestojs/ui';
import {
    BooleanField,
    CharField,
    CurrencyField,
    NumberField,
    viewModelFactory,
} from '@prestojs/viewmodel';
import React from 'react';
// You can replace this with
// import { getFormatterForField } from '@prestojs/ui';
// We use custom version here to support nextjs (which is what doc site is written in)
import defaultGetFormatterForField from '../../../../getFormatterForField';

function getFormatterForField(field) {
    // Provide override for CurrencyField
    if (field instanceof CurrencyField) {
        return [
            NumberFormatter,
            { localeOptions: { style: 'currency', currency: 'USD', currencyDisplay: 'code' } },
        ];
    }
    // Otherwise fall back to defaults
    return defaultGetFormatterForField(field);
}

class Product extends viewModelFactory(
    {
        id: new NumberField(),
        name: new CharField(),
        price: new CurrencyField(),
        active: new BooleanField({ label: 'Active?' }),
    },
    { pkFieldName: 'id' }
) {}

export default function Basic() {
    const product = new Product({
        id: 1,
        name: 'Superfluous Sandals',
        price: '1337.37',
        active: true,
    });
    return (
        <UiProvider getFormatterForField={getFormatterForField}>
            <div className="grid grid-cols-1 gap-4 w-full mt-5">
                <strong>Using bound fields from a ViewModel instance</strong>
                <dl>
                    <dt>{Product.fields.name.label}</dt>
                    <dd>
                        <FieldFormatter field={product._f.name} />
                    </dd>
                    <dt>{Product.fields.price.label}</dt>
                    <dd>
                        <FieldFormatter field={product._f.price} />
                    </dd>
                    <dt>{Product.fields.active.label}</dt>
                    <dd>
                        <FieldFormatter field={product._f.active} />
                    </dd>
                </dl>
                <hr />
                <strong>Explicitly passing field and value</strong>
                <FieldFormatter field={Product.fields.price} value="9999999.99" />
            </div>
        </UiProvider>
    );
}
