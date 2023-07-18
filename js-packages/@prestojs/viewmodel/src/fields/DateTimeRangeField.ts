import DateTimeField from './DateTimeField';
import type { FieldProps } from './Field';
import RangeField, { RangeFieldProps } from './RangeField';

/**
 * @expandproperties
 */
export type DateTimeRangeFieldProps = Omit<RangeFieldProps<Date, string | Date>, 'boundsField'> & {
    /**
     * Any extra props to pass through to the [DateTimeField](doc:DateTimeField) used for each value in the range.
     */
    boundsFieldProps?: FieldProps<Date>;
};

/**
 * A field that represents a date range. See [RangeField](doc:RangeField) for details about ranges generally.
 *
 * > Range values are always assumed to be inclusive of both ends of the range. If your backend returns a range exclusive
 * > of either end you will need to convert it first.
 *
 * <Usage>
 *
 *     To use, instantiate the class with any of the [Field](doc:Field) props you want to customize:
 *
 *     ```js
 *     new DateTimeRangeField({ label: 'Dates' });
 *     ```
 *
 *     Pass `boundsFieldProps` to pass through extra props to the [DateTimeField](doc:DateTimeField) used for each value in the range:
 *
 *     ```js
 *     new DateTimeRangeField({ boundsFieldsProps: { widgetProps: { format: 'MMMM Do YYYY, h:mm a' }} })
 *     ```
 *
 * See the examples below for usage with widgets & formatters.
 * </Usage>
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class DateTimeRangeField extends RangeField<Date, string | Date> {
    static fieldClassName = 'DateTimeRangeField';

    constructor({ boundsFieldProps, ...rest }: DateTimeRangeFieldProps = {}) {
        super({ ...rest, boundsField: new DateTimeField(boundsFieldProps) });
    }
}
