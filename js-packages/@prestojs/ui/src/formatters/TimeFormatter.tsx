/**
 * @expand-properties
 */
type TimeFormatterProps = {
    /**
     * The value to parse. Should be in one of the following formats `HH:mm`, `HH:mm:ss` or `HH:mm:ss.sss` where:
     *
     * * `HH` is the number of complete hours that have passed since midnight as two decimal digits from 00 to 24.
     * * `mm` is the number of complete minutes since the start of the hour as two decimal digits from 00 to 59.
     * * `ss` is the number of complete seconds since the start of the minute as two decimal digits from 00 to 59.
     * * `sss` is the number of complete milliseconds since the start of the second as three decimal digits
     */
    value: string | null;
    /**
     * Optional locales to use. See [using locales](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString#using_locales) for more information.
     */
    locales?: string | Array<string>;
    /**
     * Options to pass through to [toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString#using_options)
     */
    localeOptions?: Intl.DateTimeFormatOptions;
};

/**
 * Formats a time input based on user browser's locale. Returns null when value is either null or unparseable as a time, toLocaleTimeString otherwise.
 *
 * Both `locales` and `options` used are customizable. For values available, see: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString)
 *
 * @extract-docs
 * @menu-group Formatters
 */
export default function TimeFormatter(props: TimeFormatterProps): string | null {
    const { value, locales = [], localeOptions } = props;
    if (!value) return null;

    // we use a dummy date here as the day's irrelevant for toLocaleTimeString
    if (Number.isNaN(Date.parse(`1970-01-01T${value}`))) {
        return null;
    }

    const finalValue = new Date(`1970-01-01T${value}`);

    return finalValue.toLocaleTimeString(locales, localeOptions);
}
