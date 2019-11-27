import Field, { Props } from './Field';

interface Boundary<T> extends Props<T> {
    lowerBound: T | null | undefined;
    upperBound: T | null | undefined;
    [propName: string]: any;
}

/**
 * Base class for range fields (fields with a boundary).
 *
 * Note this is not a field for specifying two values (ie, "forming" of a range), but instead a single value that has to fall within two given ones ("use" of a range).
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
