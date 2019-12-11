import Field from './Field';

/**
 * Base class for numeric fields
 *
 * Other numeric fields (IntegerField, DecimalField, FloatField...) will extend this.
 *
 */
export default class NumberField<T = string | number> extends Field<string | number> {
    public minValue?: number;
    public maxValue?: number;

    constructor(values) {
        const { name, minValue, maxValue, ...rest } = values;

        if (minValue !== undefined && typeof minValue !== 'number')
            throw new Error(`Field ${name}: "minValue" should be a number, received: ${minValue}`);
        if (maxValue !== undefined && typeof maxValue !== 'number')
            throw new Error(`Field ${name}: "maxValue" should be a number, received: ${maxValue}`);
        super({ name, ...rest });

        this.minValue = minValue;
        this.maxValue = maxValue;
    }
}
