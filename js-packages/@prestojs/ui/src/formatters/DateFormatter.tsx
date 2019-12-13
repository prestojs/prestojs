/*
 * Formats a date input based on user browser's locale. Returns null when value is either null or Not-a-Date, toLocaleDateString otherwise.
 *
 * Both `locales` and `options` used are customizeable. For values available, see: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString)
 */
export default function DateFormatter({
    value,
    locales = [],
    localeOptions,
}: {
    value: Date | string | null;
    locales?: string | Array<string>;
    localeOptions?: Intl.DateTimeFormatOptions;
}): string | null {
    let finalValue;

    if (!value) {
        return null;
    }

    if (!(value instanceof Date)) {
        if (Number.isNaN(Date.parse(value))) {
            return null;
        }
        finalValue = new Date(value);
    } else {
        finalValue = value;
    }

    return finalValue.toLocaleDateString(locales, localeOptions);
}
