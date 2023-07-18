import FloatField from './FloatField';
import { NumberFieldProps } from './NumberField';
import RangeField, { RangeFieldProps } from './RangeField';

/**
 * @expandproperties
 */
export type FloatRangeFieldProps = Omit<RangeFieldProps<number, string | number>, 'boundsField'> & {
    /**
     * Any extra props to pass through to the [FloatField](doc:FloatField) used for each value in the range.
     */
    boundsFieldProps?: NumberFieldProps<number>;
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
 *     new FloatRangeField({ label: 'Price Range' });
 *     ```
 *
 *     Pass `boundsFieldProps` to pass through extra props to the [FloatField](doc:FloatField) used for each value in the range:
 *
 *     ```js
 *     new FloatRangeField({ boundsFieldsProps: { formatterProps: {
 *                    locales: ['en-AU'],
 *                    localeOptions: {
 *                         style: 'unit',
 *                         unit: 'liter',
 *                     },
 *     }} })
 *     ```
 *
 * See the examples below for usage with widgets & formatters.
 * </Usage>
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class FloatRangeField extends RangeField<number, string | number> {
    static fieldClassName = 'FloatRangeField';

    constructor({ boundsFieldProps, ...rest }: FloatRangeFieldProps = {}) {
        super({ ...rest, boundsField: new FloatField(boundsFieldProps) });
    }
}
