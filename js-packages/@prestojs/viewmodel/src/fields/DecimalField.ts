import NumberField from './NumberField';

/**
 * Decimal Field. Stores decimal value as a string.
 *
 * To support decimal operations consider a custom implementation that uses a decimal library eg. decimal.js
 *
 * Also used by CurrencyField.
 *
 * See also: [FloatField](doc:FloatField)
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class DecimalField extends NumberField<string> {
    public decimalPlaces?: number;

    constructor(values) {
        const { decimalPlaces, ...rest } = values;

        if (decimalPlaces !== undefined && typeof decimalPlaces !== 'number')
            throw new Error(`"decimalPlaces" should be a number, received: ${decimalPlaces}`);
        if (decimalPlaces <= 0)
            throw new Error(
                `"decimalPlaces" should be a positive number, received: ${decimalPlaces}`
            );

        super(rest);

        this.decimalPlaces = decimalPlaces;
    }

    parse(value: any): string | null {
        if (value === '') {
            // treat empty string as null
            return null;
        }
        return value;
    }
}
