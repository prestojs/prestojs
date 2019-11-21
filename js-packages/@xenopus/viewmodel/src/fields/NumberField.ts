import Field from './Field';

/**
 * Base class for numeric fields
 *
 * Other numeric fields (IntegerField, DecimalField, FloatField...) will extend this.
 */
export default class NumberField extends Field<number> {
    parse(value: any): number {
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
