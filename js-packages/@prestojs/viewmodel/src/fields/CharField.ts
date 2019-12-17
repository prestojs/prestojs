import Field, { Props } from './Field';

type CharFieldProps = Props<string> & { maxLength?: number };

/**
 * Base class for string fields
 *
 * Other char fields (EmailField, URLField...) will extend this.
 *
 * @extract-docs
 */
export default class CharField extends Field<string> {
    public maxLength?: number;

    constructor(values: CharFieldProps = {}) {
        const { maxLength, blankAsNull, ...rest } = values;

        const asNull = blankAsNull ?? false;

        if (maxLength !== undefined && maxLength !== null && typeof maxLength !== 'number')
            throw new Error(`"maxLength" should be a number, received: ${maxLength}`);
        if (maxLength !== undefined && maxLength !== null && maxLength <= 0)
            throw new Error(`"maxLength" should be a positive number, received: ${maxLength}`);

        super({blankAsNull: asNull, ...rest});

        this.maxLength = maxLength;
    }
}
