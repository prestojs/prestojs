import Field, { FieldProps } from './Field';

type RangeFieldProps<T> = FieldProps<T> & {
    separator?: string;
};

/**
 * Base class for range fields (see: https://www.postgresql.org/docs/9.6/rangetypes.html).
 *
 * Other range based fields (DateTimeRangeField, IntegerRangeField, ...) will extend this.
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class RangeField<T> extends Field<T> {
    static fieldClassName = 'RangeField';
    public separator: string;

    constructor(values: RangeFieldProps<T> = {}) {
        const { separator = '-', ...rest } = values;
        super(rest);
        this.separator = separator;
    }
}
