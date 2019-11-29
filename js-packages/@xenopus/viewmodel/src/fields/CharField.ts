import Field from './Field';

/**
 * Base class for string fields
 *
 * Other char fields (EmailField, URLField...) will extend this.
 */
export default class CharField extends Field<string> {
    public maxLength?: number;

    constructor(values) {
        const { name, maxLength } = values;

        delete values.maxLength;
        if (maxLength !== undefined && typeof maxLength !== 'number')
            throw new Error(
                `Field ${name}: "maxLength" should be a number, received: ${maxLength}`
            );
        if (maxLength <= 0)
            throw new Error(
                `Field ${name}: "maxLength" should be a positive number, received: ${maxLength}`
            );

        super(values);

        this.maxLength = maxLength;
    }
}
