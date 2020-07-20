import Field, { FieldProps } from './Field';

/**
 * @expand-properties
 */
type NumberFieldProps<T> = FieldProps<T> & {
    minValue?: number;
    maxValue?: number;
};

/**
 * Base class for numeric fields
 *
 * Other numeric fields (IntegerField, DecimalField, FloatField...) will extend this.
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class NumberField<T = string | number> extends Field<T> {
    static fieldClassName = 'NumberField';
    public minValue?: number;
    public maxValue?: number;

    constructor(values: NumberFieldProps<T> = {}) {
        const { minValue, maxValue, ...rest } = values;

        if (minValue !== undefined && typeof minValue !== 'number')
            throw new Error(`"minValue" should be a number, received: ${minValue}`);
        if (maxValue !== undefined && typeof maxValue !== 'number')
            throw new Error(`"maxValue" should be a number, received: ${maxValue}`);

        super(rest);

        this.minValue = minValue;
        this.maxValue = maxValue;
    }
}
