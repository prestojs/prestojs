import Field, { FieldProps } from './Field';

/**
 * @expand-properties
 */
export interface NumberFieldProps<T> extends FieldProps<T> {
    minValue?: number;
    maxValue?: number;
}

/**
 * Base class for any numeric fields (see above for more specific fields).
 *
 * This class accepts all the props of [Field](doc:Field) as well as the optional
 * `minValue` and `maxValue` properties which can be used by form widgets to validate
 * the inputted value
 *
 * ### Usage
 *
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   age: new NumberField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide `minValue`, `maxValue` or any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   age: new NumberField({
 *     minValue: 0,
 *     helpText: 'Enter your age'
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * @extract-docs
 * @menu-group Fields
 * @typeParam ValueT The type of the numeric value. This could be `number` or `string` or some other object (eg. decimal implementation)
 * @typeParam ValueT This the type the field knows how to parse into `ValueT` when constructing a `ViewModel`.
 */
export default class NumberField<ValueT = string | number, ParsableValueT = ValueT> extends Field<
    ValueT,
    ParsableValueT
> {
    static fieldClassName = 'NumberField';
    public minValue?: number;
    public maxValue?: number;

    constructor(values: NumberFieldProps<ValueT> = {}) {
        const { minValue, maxValue, ...rest } = values;

        if (minValue != null && typeof minValue !== 'number')
            throw new Error(`"minValue" should be a number, received: ${minValue}`);
        if (maxValue != null && typeof maxValue !== 'number')
            throw new Error(`"maxValue" should be a number, received: ${maxValue}`);

        super(rest);

        this.minValue = minValue;
        this.maxValue = maxValue;
    }
}
