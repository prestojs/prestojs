import Field, { Props } from './Field';

type CharFieldProps = Props<string> & { maxLength?: number };

/**
 * Base class for string fields
 *
 * Other char fields (EmailField, URLField...) will extend this.
 */
export default class CharField extends Field<string> {
    public maxLength?: number;

    constructor(values: CharFieldProps = {}) {
        const { maxLength, ...rest } = values;

        if (maxLength !== undefined && typeof maxLength !== 'number')
            throw new Error(`"maxLength" should be a number, received: ${maxLength}`);
        if (maxLength !== undefined && maxLength <= 0)
            throw new Error(`"maxLength" should be a positive number, received: ${maxLength}`);

        super(rest);

        this.maxLength = maxLength;
    }
}
