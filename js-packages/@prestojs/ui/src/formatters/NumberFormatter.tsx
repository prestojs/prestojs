/*
 * Formats a numeric input based on user browser's locale. Returns null when value is either null or NaN.
 *
 * Both `locales` and `options` used are customizeable. For values available, see: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString)
 */
export default function NumberFormatter({
    value,
    locales = [],
    localeOptions,
}: {
    value: number | null;
    locales?: string | Array<string>;
    localeOptions?: Intl.NumberFormatOptions;
}): string | null {
    if (value === null) {
        return value;
    }
    let finalValue = value;
    if (typeof value != 'number') {
        finalValue = Number(value);
    }
    if (Number.isNaN(finalValue)) {
        return null;
    }

    return finalValue.toLocaleString(locales, localeOptions);
}
