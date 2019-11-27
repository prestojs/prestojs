import NumberField from './NumberField';

/**
 * Decimal Field. Stores decimal value as a string.
 *
 * To support decimal operations consider a custom implementation that uses a decimal library eg. decimal.js
 *
 * Also used by CurrencyField.
 *
 * See also: FloatField
 */
export default class DecimalField extends NumberField<string> {
    parse(value: any): string {
        if (value === '' || value == null) {
            // treat empty string as null
            return null;
        }
        return value;
    }
}
