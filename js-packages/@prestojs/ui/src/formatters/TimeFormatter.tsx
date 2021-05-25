import { formatTime, parseTime } from '@prestojs/util/';
import React, { ReactNode, useMemo } from 'react';

/**
 * @expand-properties
 */
type TimeFormatterProps = {
    /**
     * What to render when `value` is `null`, `undefined` or the empty string
     *
     * Defaults to `null`
     */
    blankLabel?: ReactNode;
    /**
     * The value to parse. Should be in one of the following formats `HH:mm`, `HH:mm:ss` or `HH:mm:ss.sss` where:
     *
     * * `HH` is the number of complete hours that have passed since midnight as two decimal digits from 00 to 24.
     * * `mm` is the number of complete minutes since the start of the hour as two decimal digits from 00 to 59.
     * * `ss` is the number of complete seconds since the start of the minute as two decimal digits from 00 to 59.
     * * `sss` is the number of complete milliseconds since the start of the second as three decimal digits
     */
    value: string | Date | null;
    /**
     * Optional locales to use. See [using locales](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString#using_locales) for more information.
     */
    locales?: string | Array<string>;
    /**
     * Options to pass through to [toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString#using_options)
     */
    localeOptions?: Intl.DateTimeFormatOptions & {
        // https://github.com/microsoft/TypeScript/issues/38266
        timeStyle?: 'full' | 'long' | 'medium' | 'short';
    };

    /**
     * What to render when passed value is not a valid time
     *
     * Defaults to `null`
     */
    invalidValueLabel?: ReactNode;
};

/**
 * Formats a time input based on the browser's locale using [Date.toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString).
 *
 * If the `value` is a string the time is parsed from it and a dummy `Date` object will be created. Note that you can
 * pass `localeOptions.timeZone` but it will give the wrong results if `value` doesn't include the timezone offset.
 *
 * Valid strings are:
 *
 * * `3:55` - hour & minutes
 * * `09:30:15` - hour, minutes, seconds (with leading zero)
 * * `22:40:15.320` - includes milliseconds
 * * `10:30:15.345+10:00` - includes timezone offset
 *
 * Alternatively `value` can be passed directly as a `Date` in which case [toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString)
 * will be called on it directly.
 *
 * If no value is provided `blankLabel` is returned.
 *
 * If an invalid value is provided `invalidValueLabel` is returned.
 *
 * This is the [default formatter](doc:getFormatterForField) used for [TimeField](doc:TimeField)
 *
 * See also [parseTime](doc:parseTime) and [formatTime])(doc:formatTime)
 *
 * @extract-docs
 * @menu-group Formatters
 */
export default function TimeFormatter(props: TimeFormatterProps): React.ReactElement {
    const { blankLabel, invalidValueLabel, value, locales = [], localeOptions } = props;
    // This will be `Date` if `value` is a Date otherwise time parts as returned by `parseTime` or null if invalid
    // time or `value` is null.
    const dateOrTimeParts = useMemo(() => {
        if (value == null || value === '') {
            return null;
        }
        if (value instanceof Date) {
            return value;
        }
        try {
            return parseTime(value);
        } catch (e) {
            return null;
        }
    }, [value]);
    if (value == null || value === '') {
        return <>{blankLabel}</>;
    }
    // If this is null then we know it's invalid because `value` is not null
    if (dateOrTimeParts == null) {
        return <>{invalidValueLabel}</>;
    }
    return <>{formatTime(dateOrTimeParts, { locales, localeOptions })}</>;
}
