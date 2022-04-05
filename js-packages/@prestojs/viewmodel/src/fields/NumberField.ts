import Field, { FieldProps } from './Field';

/**
 * @expand-properties
 */
export interface NumberFieldProps<T> extends FieldProps<T> {
    minValue?: number;
    maxValue?: number;
}

/**
 * Base class for numeric fields
 *
 * Other numeric fields (IntegerField, DecimalField, FloatField...) will extend this.
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
