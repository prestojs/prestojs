import Field, { FieldProps, ViewModelFieldWidgetProps } from './Field';

/**
 * @expand-properties
 */
type CharFieldProps = FieldProps<string> & { maxLength?: number };

/**
 * Base class for any string based fields (see above for more specific fields).
 *
 * This class accepts all the props of [Field](doc:Field) as well as the optional
 * `maxLength` property which can be used by form widgets to limit the accepted
 * length of the inputted text.
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   fullName: new CharField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide `maxLength` or any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   fullName: new CharField({
 *     maxLength: 50,
 *     helpText: 'Enter name in 50 characters or less'
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 * </Usage>
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class CharField extends Field<string> {
    static fieldClassName = 'CharField';
    public maxLength?: number;

    constructor(values: CharFieldProps = {}) {
        const { maxLength, ...rest } = values;

        if (maxLength != null && typeof maxLength !== 'number')
            throw new Error(`"maxLength" should be a number, received: ${maxLength}`);
        if (maxLength != null && maxLength <= 0)
            throw new Error(`"maxLength" should be a positive number, received: ${maxLength}`);

        super(rest);

        this.maxLength = maxLength;
    }

    getWidgetProps(): ViewModelFieldWidgetProps & { maxLength?: number } {
        return {
            ...super.getWidgetProps(),
            maxLength: this.maxLength,
        };
    }
}
