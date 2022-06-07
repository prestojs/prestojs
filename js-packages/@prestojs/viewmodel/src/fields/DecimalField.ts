import { ViewModelFieldWidgetProps } from './Field';
import NumberField, { NumberFieldProps } from './NumberField';

/**
 * @expand-properties
 */
type DecimalFieldProps = NumberFieldProps<string> & {
    /**
     * The number of decimal places that should be accepted
     */
    decimalPlaces?: number;
};

/**
 * A decimal field that stores the value as a string rather than a `number` to support better precision.
 *
 * This class accepts all the props of [NumberField](doc:NumberField) as well as the optional
 * `decimalPlaces` properties which can be used by form widgets to limit the accepted values.
 *
 * ## Usage
 *
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   total: new DecimalField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide `minValue`, `maxValue`, `decimalPlaces` or any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   total: new CharField({
 *     minValue: '0',
 *     decimalPlaces: 2,
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * <Alert type="info">
 * To support decimal operations consider a custom implementation that uses a decimal library eg. decimal.js
 * </Alert>
 *
 * See also: [FloatField](doc:FloatField)
 *
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class DecimalField extends NumberField<string> {
    static fieldClassName = 'DecimalField';
    public decimalPlaces?: number;

    constructor(values: DecimalFieldProps = {}) {
        const { decimalPlaces, ...rest } = values;

        if (decimalPlaces !== undefined && typeof decimalPlaces !== 'number')
            throw new Error(`"decimalPlaces" should be a number, received: ${decimalPlaces}`);
        if (decimalPlaces !== undefined && decimalPlaces <= 0)
            throw new Error(
                `"decimalPlaces" should be a positive number, received: ${decimalPlaces}`
            );

        super(rest);

        this.decimalPlaces = decimalPlaces;
    }

    parse(value: any): string | null {
        if (value === '') {
            // treat empty string as null
            return null;
        }
        return value;
    }

    normalize(value: string): string | null {
        return this.parse(value);
    }

    getWidgetProps(): ViewModelFieldWidgetProps {
        return {
            precision: this.decimalPlaces,
            ...super.getWidgetProps(),
        };
    }
}
