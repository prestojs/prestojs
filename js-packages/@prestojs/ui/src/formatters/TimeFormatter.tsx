/*
 * Formats a time input based on user browser's locale. Returns null when value is either null or unparseable as a time, toLocaleTimeString otherwise.
 *
 * Both `locales` and `options` used are customizeable. For values available, see: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString)
 */

export default function TimeFormatter({
    value,
    locales = [],
    localeOptions,
}: {
    value: string | null;
    locales?: string | Array<string>;
    localeOptions?: Intl.DateTimeFormatOptions;
}): string | null {
    if (!value) return null;

    // we use a dummy date here as the day's irrelevant for toLocaleTimeString
    if (Number.isNaN(Date.parse(`0999-04-11T${value}`))) {
        return null;
    }

    const finalValue = new Date(`0999-04-11T${value}`);

    return finalValue.toLocaleTimeString(locales, localeOptions);
}
