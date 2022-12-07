import NumberField from './NumberField';

/**
 * A field to store floating point values
 *
 * This class accepts all the props of [NumberField](doc:NumberField).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   total: new FloatField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide `minValue`, `maxValue` or any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   total: new CharField({
 *     minValue: 0,
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * <Alert type="info">
 * This field stores the value as a [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number). If
 * you need arbitrary precision use [DecimalField](doc:DecimalField)
 * </Alert>
 * </Usage>
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class FloatField extends NumberField<number, string | number> {
    static fieldClassName = 'FloatField';
    private _parseValue(value: any, shouldThrow: boolean) {
        // Don't force empty string, null or undefined to a number (which would be 0) -
        // force them both to be null to represent no value set.
        if (value === '' || value == null) {
            return null;
        }
        // If we can't parse number just return it as is so as not to break inputs
        if (Number.isNaN(Number(value))) {
            if (shouldThrow) {
                throw new Error('Invalid value for FloatField');
            }
            return value;
        }
        if (typeof value == 'number') {
            return value;
        }
        return parseFloat(value);
    }
    parse(value: any): number | null {
        return this._parseValue(value, false);
    }
    normalize(value: string | number): number | null {
        return this._parseValue(value, true);
    }
}
