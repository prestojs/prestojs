import React, { ReactNode } from 'react';

/**
 * @expand-properties
 */
type NumberFormatterProps = {
    /**
     * The number to format. If `value` is a `string` then value will be coerced to `Number` and if the result is `NaN` then
     * `invalidValueLabel` will be returned;
     */
    value?: number | string | null;
    /**
     * The [locales](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString#using_locales) option passed to
     * [Number.toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString).
     */
    locales?: string | Array<string>;
    /**
     * The [localeOptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString#using_options) passed to
     * [Number.toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString).
     */
    localeOptions?: Intl.NumberFormatOptions;
    /**
     * What to render when `value` is `null`, `undefined` or an empty string
     *
     * Defaults to `null`
     */
    blankLabel?: ReactNode;
    /**
     * What to render when passed value is not a valid number
     *
     * Defaults to `null`
     */
    invalidValueLabel?: ReactNode;
};

/**
 * Formats a numeric input based on user browser's locale.
 *
 * If no value is provided `blankLabel` is returned.
 *
 * If an invalid value is provided `invalidValueLabel` is returned.
 *
 * This is the [default formatter](doc:getFormatterForField) used for [NumberField](doc:NumberField), [DecimalField](doc:DecimalField),
 * [FloatField](doc:FloatField) and [IntegerField](doc:IntegerField)
 *
 * <Usage>
 *     Basic usage just requires passing the number through in the `value` prop:
 *
 *     ```js
 *     <NumberFormatter value={5000} />
 *     ```
 *
 *     If a string is passed it will be parsed as a Number.
 *
 *     By default, if the value is not a valid number it will not render anything. You can change this with the
 *     `invalidValueLabel` prop:
 *
 *     ```js
 *     <NumberFormatter value="abc" invalidValueLabel={<em>NaN</em>} />
 *     ```
 *     If no value is passed then, by default, nothing will be rendered. You can pass `blankLabel` to render a default
 *     when no value is present:
 *
 *     ```js
 *     <NumberFormatter value={null} blankLabel={<em>Not set</em>} />
 *     ```
 *
 *     You can control how the value is formatted using [localeOptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString#using_options)
 *
 *     ```js
 *     <NumberFormatter value={5000} localeOptions={{ style: 'currency', currency: 'USD' }} />
 *     ```
 *
 * </Usage>
 *
 * @extract-docs
 * @menu-group Formatters
 */
export default function NumberFormatter(props: NumberFormatterProps): React.ReactElement {
    const {
        value,
        locales = [],
        blankLabel = null,
        invalidValueLabel = null,
        localeOptions,
    } = props;
    if (value == null || value === '') {
        return <>{blankLabel}</>;
    }
    let finalValue = value;
    if (typeof value != 'number') {
        finalValue = Number(value);
    }
    if (Number.isNaN(finalValue)) {
        return <>{invalidValueLabel}</>;
    }

    return <>{finalValue.toLocaleString(locales, localeOptions)}</>;
}
