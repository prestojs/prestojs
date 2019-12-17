import Field, { Props } from './Field';

type NumberFieldProps = Props<string | number> & {
    minValue?: number;
    maxValue?: number;
};

/**
 * Base class for numeric fields
 *
 * Other numeric fields (IntegerField, DecimalField, FloatField...) will extend this.
 *
 */
export default class NumberField<T = string | number> extends Field<string | number> {
    public minValue?: number;
    public maxValue?: number;

    constructor(values: NumberFieldProps = {}) {
        const { minValue, maxValue, ...rest } = values;

        if (minValue !== undefined && minValue !== null && typeof minValue !== 'number')
            throw new Error(`"minValue" should be a number, received: ${minValue}`);
        if (maxValue !== undefined && minValue !== null && typeof maxValue !== 'number')
            throw new Error(`"maxValue" should be a number, received: ${maxValue}`);

        super(rest);

        this.minValue = minValue;
        this.maxValue = maxValue;
    }
}
