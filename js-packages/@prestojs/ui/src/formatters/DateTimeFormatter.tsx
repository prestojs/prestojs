import React, { ReactNode } from 'react';

/**
 * @expandproperties
 */
export type DateTimeFormatterProps = {
    /**
     * The value to format
     */
    value: Date | string | null;
    /**
     * The [locales](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString#using_locales) option passed to
     * [Date.toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString).
     */
    locales?: string | Array<string>;
    /**
     * The [localeOptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString#using_options) passed to
     * [Date.toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString).
     */
    localeOptions?: Intl.DateTimeFormatOptions & {
        // https://github.com/microsoft/TypeScript/issues/38266
        dateStyle?: 'full' | 'long' | 'medium' | 'short';
        timeStyle?: 'full' | 'long' | 'medium' | 'short';
    };
    /**
     * What to render when `value` is `null`, `undefined` or an empty string
     *
     * Defaults to `null`
     */
    blankLabel?: ReactNode;
    /**
     * What to render when passed date is invalid
     *
     * Defaults to `null`
     */
    invalidDateLabel?: ReactNode;
};

/**
 * Formats a date with time based on user browser's locale.
 *
 * If no value is provided `blankLabel` is returned.
 *
 * If an invalid date is provided `invalidDateLabel` is returned.
 *
 * This is the [default formatter](doc:getFormatterForField) used for [DateTimeField](doc:DateTimeField)
 *
 * @extractdocs
 * @menugroup Formatters
 */
export default function DateTimeFormatter(
    props: DateTimeFormatterProps
): React.ReactElement | null {
    const {
        value,
        locales = [],
        blankLabel = null,
        invalidDateLabel = null,
        localeOptions,
    } = props;
    let finalValue;

    if (!value) {
        return <>{blankLabel}</>;
    }

    if (!(value instanceof Date)) {
        if (Number.isNaN(Date.parse(value))) {
            return <>{invalidDateLabel}</>;
        }
        finalValue = new Date(value);
    } else {
        finalValue = value;
    }

    return finalValue.toLocaleString(locales, localeOptions);
}
