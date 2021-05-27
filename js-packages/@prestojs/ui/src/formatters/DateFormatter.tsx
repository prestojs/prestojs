import React, { ReactElement, ReactNode } from 'react';

/**
 * @expand-properties
 */
type DateFormatterProps = {
    /**
     * The value to format
     */
    value: Date | string | null;
    /**
     * The [locales](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString#using_locales) option passed to
     * [Date.toLocaleDateString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString).
     */
    locales?: string | Array<string>;
    /**
     * The [localeOptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString#using_options) passed to
     * [Date.toLocaleDateString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString).
     */
    localeOptions?: Intl.DateTimeFormatOptions & {
        // https://github.com/microsoft/TypeScript/issues/38266
        dateStyle?: 'full' | 'long' | 'medium' | 'short';
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
 * Formats a date without time based on user browser's locale.
 *
 * If no value is provided `blankLabel` is returned.
 *
 * If an invalid date is provided `invalidDateLabel` is returned.
 *
 * This is the [default formatter](doc:getFormatterForField) used for [DateField](doc:DateField)
 *
 * @extract-docs
 * @menu-group Formatters
 */
export default function DateFormatter(props: DateFormatterProps): ReactElement | null {
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

    return finalValue.toLocaleDateString(locales, localeOptions);
}
