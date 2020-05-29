import NumberField from './NumberField';

/**
 * Float Field.
 *
 * Use only if stored number is tolerant on precision error.
 *
 * See also: [DecimalField](doc:DecimalField)
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class FloatField extends NumberField<number> {
    parse(value: any): number | null {
        // Don't force empty string, null or undefined to a number (which would be 0) -
        // force them both to be null to represent no value set.
        if (value === '' || value == null) {
            return null;
        }
        const numberValue = Number(value);
        // If we can't parse number just return it as is so as not to break inputs
        if (Number.isNaN(numberValue)) {
            return value;
        }
        return numberValue;
    }
}
