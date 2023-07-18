import NumberField from './NumberField';

/**
 * A field to store integer values
 *
 * This class accepts all the props of [Field](doc:Field) as well as the optional
 * `minValue` & `maxValue` properties which can be used by form widgets to limit the accepted
 * values.
 *
 * <Usage>
 *
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   age: new IntegerField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide `minValue`, `maxValue` or any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   age: new CharField({
 *     minValue: 0,
 *     maxValue: 100,
 *     helpText: 'Enter your age'
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * </Usage>
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class IntegerField extends NumberField<number, string | number> {
    static fieldClassName = 'IntegerField';

    private _parse(value: any, shouldThrow: boolean): number | null {
        if (value === '' || value == null) {
            return null;
        }
        if (Number.isNaN(Number(value))) {
            if (shouldThrow) {
                throw new Error('Invalid value for IntegerField');
            }
            return value;
        }
        return parseInt(value, 10);
    }

    parse(value: any): number | null {
        return this._parse(value, false);
    }

    normalize(value: string | number): number | null {
        return this._parse(value, true);
    }
}
