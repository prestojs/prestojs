import Field, { FieldProps } from './Field';

export type RangeValue<T> = {
    lower: T;
    upper: T;
};

/**
 * @expandproperties
 */
export type RangeFieldProps<T, ParseableValueT> = Omit<
    FieldProps<RangeValue<T>, RangeValue<T>>,
    'asyncChoices' | 'choices'
> & {
    boundsField: Field<T, ParseableValueT>;
};

/**
 * A field that represents a range. A range is represented as a `lower` and `upper` value. For example, the below
 * value represents a range from 5 to 10 inclusive:
 *
 * ```json
 * { "lower": 5, "upper": 10}
 * ```
 *
 * > Range values are always assumed to be inclusive of both ends of the range. If your backend returns a range exclusive
 * > of either end you will need to convert it first.
 *
 * Each `RangeField` has a `boundsField` which is used to handle all details of the `lower` and `upper` values. For example,
 * this field is used to `normalize` or `parse` values. It is also used by [getFormatterForField](doc:getFormatterForField)
 * to determine how to format each end of the range. It can also be used to pass through extra props to the formatter
 * or widget by including `formatterProps` or `widgetProps`.
 *
 * <Usage>
 *
 * For common use cases you can use one of the pre-defined range fields:
 *
 * * [DateRangeField](doc:DateRangeField)
 * * [DateTimeRangeField](doc:DateTimeRangeField)
 * * [IntegerRangeField](doc:IntegerRangeField)
 * * [DecimalRangeField](doc:DecimalRangeField)
 * * [FloatRangeField](doc:FloatRangeField)
 *
 * To use directly, make sure to pass in a `boundsField`:
 *
 * ```js
 * new RangeField({
 *     boundsField: new CharField({ choices: [
 *         ['level1', 'Level 1'],
 *         ['level2', 'Level 2'],
 *         ['level3', 'Level 3'],
 *         ['level4', 'Level 4'],
 *         ['level5', 'Level 5'],
 *         ['level6', 'Level 6'],
 *     ]})
 * });
 * ```
 *
 * </Usage>
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class RangeField<T, ParseableValueT> extends Field<
    RangeValue<T>,
    RangeValue<ParseableValueT>
> {
    static fieldClassName = 'RangeField';
    public boundsField: Field<T, ParseableValueT>;

    constructor(values: RangeFieldProps<T, ParseableValueT>) {
        const { boundsField, ...rest } = values;
        super(rest);
        this.boundsField = boundsField;
    }

    public parse(value: RangeValue<ParseableValueT> | null): RangeValue<T> | null {
        if (!value) {
            return value;
        }
        return {
            lower: this.boundsField.parse(value.lower) as T,
            upper: this.boundsField.parse(value.upper) as T,
        };
    }

    normalize(value: RangeValue<ParseableValueT>): RangeValue<T> | null {
        if (!value) {
            return value;
        }
        return {
            lower: this.boundsField.normalize(value.lower) as T,
            upper: this.boundsField.normalize(value.upper) as T,
        };
    }
}
