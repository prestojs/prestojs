import Field, { FieldProps } from './Field';

export type RangeValue<T> = {
    lower: T;
    upper: T;
    bounds: string;
};

/**
 * @expandproperties
 */
export type RangeFieldProps<T> = FieldProps<RangeValue<T>> & {
    valueField: Field<T>;
    separator?: string;
};

export default class RangeField<T> extends Field<RangeValue<T>> {
    static fieldClassName = 'RangeField';
    public separator: string;
    public valueField: Field<T>;

    constructor(values: RangeFieldProps<T>) {
        const { separator = '-', valueField, ...rest } = values;
        super(rest);
        this.separator = separator;
        this.valueField = valueField;
    }

    normalize(value: RangeValue<T>): RangeValue<T> | null {
        if (!value) {
            return value;
        }
        return {
            lower: this.valueField.normalize(value.lower) as T,
            upper: this.valueField.normalize(value.upper) as T,
            bounds: value.bounds,
        };
    }
}
