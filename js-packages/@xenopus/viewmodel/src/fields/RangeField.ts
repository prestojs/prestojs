import Field, { Props } from './Field';

interface Boundary<T> extends Props<T> {
    lowerBound: any;
    upperBound: any;
    [propName: string]: any;
}

/**
 * Base class for range fields (fields with a boundary). It's up to widget/formatter to be aware of this.
 *
 * Other range based fields (DateTimeRangeField, IntegerRangeField, ...) will extend this.
 *
 */
export default class RangeField<T> extends Field<T> {
    public lowerBound: any;
    public upperBound: any;

    constructor(values: Boundary<T>) {
        super(values);
        const { lowerBound, upperBound } = values;
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
    }
}
