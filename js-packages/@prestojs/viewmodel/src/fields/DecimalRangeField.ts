import DecimalField, { DecimalFieldProps } from './DecimalField';
import RangeField, { RangeFieldProps } from './RangeField';

/**
 * @expandproperties
 */
export type DecimalRangeFieldProps = Omit<RangeFieldProps<string, string>, 'boundsField'> & {
    /**
     * Any extra props to pass through to the [DecimalField](doc:DecimalField) used for each value in the range.
     */
    boundsFieldProps?: DecimalFieldProps;
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
 *     new DecimalRangeField({ label: 'Price Range' });
 *     ```
 *
 *     Pass `boundsFieldProps` to pass through extra props to the [DecimalField](doc:DecimalField) used for each value in the range:
 *
 *     ```js
 *     new DecimalRangeField({ boundsFieldsProps: { formatterProps: {
 *                    locales: ['en-AU'],
 *                     localeOptions: { style: 'currency', currency: 'AUD' },
 *     }} })
 *     ```
 *
 * See the examples below for usage with widgets & formatters.
 * </Usage>
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class DecimalRangeField extends RangeField<string, string> {
    static fieldClassName = 'DecimalRangeField';

    constructor({ boundsFieldProps, ...rest }: DecimalRangeFieldProps = {}) {
        super({ ...rest, boundsField: new DecimalField(boundsFieldProps) });
    }
}
