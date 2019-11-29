import Field, { Props } from './Field';

interface Boundary<T> extends Props<T> {
    lowerBound: T | null | undefined;
    upperBound: T | null | undefined;
    [propName: string]: any;
}

/**
 * Base class for range fields (fields with a boundary).
 *
 * supply lowerBound and upperBound to the constructor to define boundaries. they're optional (can be undefined / null).
 *
 * Other range based fields (DateTimeRangeField, IntegerRangeField, ...) will extend this.
 *
 */
export default class RangeField<T> extends Field<T> {
    public lowerBound: T | null | undefined;
    public upperBound: T | null | undefined;

    constructor(values: Boundary<T>) {
        super(values);
        const { lowerBound, upperBound } = values;
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
    }
}
