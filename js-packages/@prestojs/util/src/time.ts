const timeRegex =
    /^(([0-1]?[0-9])|2[0-3]):([0-5][0-9])(:([0-5][0-9])(.([0-9]{3})(\+([0-9]{2}):([0-9]{2}))?)?)?$/;

/**
 * @expandproperties
 */
type TimeParts = {
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
    /**
     * The difference in minutes between a date as evaluated in the UTC time zone and the same date in the local time zone.
     */
    timezoneOffset?: number;
};

/**
 * Thrown by `parseTime` if invalid time string is passed
 */
export class InvalidTimeError extends Error {}

/**
 * Parse a string into its constituent time parts
 *
 * Returns an object containing the `hour`, `minute`, `second`, `millisecond` and optional `timezone` values.
 *
 * Accepts input of the form `H:MM[:SS[:.mmm:[+TZ]]]` where `H` is hours, `MM` is minutes, `SS` is seconds, `mmm` is
 * milliseconds and `+TZ` is the timezone (eg. +10:00).
 *
 * Seconds & milliseconds are optional and will default to 0 if not in the string, timezone is optional and will be
 * left as undefined if not specified.
 *
 * Throws [InvalidTimeError](doc:InvalidTimeError) if string cannot be parsed
 *
 * ```js
 * parseTime("3:55")
 * // { hour: 3, minute: 55, seconds: 0, milliseconds: 0 }
 * parseTime("03:55:20")
 * // { hour: 3, minute: 55, seconds: 20, milliseconds: 0 }
 * parseTime("03:55:20.600")
 * // { hour: 3, minute: 55, seconds: 20, milliseconds: 600 }
 * parseTime("03:55:20.600+10:00")
 * // { hour: 3, minute: 55, seconds: 20, milliseconds: 600, timezoneOffset: -600 }
 * ```
 *
 * <Alert type="info">
 *   NOTE: If you pass a `Date` object then the timezone offset will always be whatever the local browser/env timezone
 *   is (ie. it's not possible to have a javascript `Date` object in another timezone).
 * </Alert>
 *
 * @param value The string or `Date` value to parse
 *
 * @extractdocs
 * @menugroup Time
 */
export function parseTime(value: string | Date): TimeParts {
    if (value instanceof Date) {
        return {
            hour: value.getHours(),
            minute: value.getMinutes(),
            second: value.getSeconds(),
            millisecond: value.getMilliseconds(),
            timezoneOffset: value.getTimezoneOffset(),
        };
    }
    const match = value.match(timeRegex);
    if (!match) {
        throw new InvalidTimeError();
    }
    const [, hour, , minute, , second, , millisecond, tzString, tzOffsetH, tzOffsetM] = match;
    let timezoneOffset;
    if (tzString) {
        timezoneOffset = -Number(tzOffsetH) * 60 + Number(tzOffsetM);
    }

    return {
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second || 0),
        millisecond: Number(millisecond || 0),
        timezoneOffset,
    };
}

function pad(value: number, l = 2): string {
    let s = Math.abs(value).toString();
    while (s.length < l) {
        s = `0${s}`;
    }
    if (value < 0) {
        return `-${value}`;
    }
    return s;
}

/**
 * @expandproperties
 */
type TimeFormatOptions = {
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
};

/**
 * Format the parts of a time - as returned by [parseTime](doc:parseTime) - as a string using
 * [toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString#using_options).
 *
 * ```js
 * formatTime(parseTime('11:30:00.000+09:30'), {
 *     localeOptions: { timeZone: 'Australia/Adelaide' },
 * });
 * // 11:30:00 AM
 *
 * formatTime(parseTime('11:30:00'), { localeOptions: { timeStyle: 'short' } });
 * // 11:30 AM
 * ```
 *
 * <Alert type="info">
 *   Note that while you can pass through `options.timeZone` this may be inaccurate if `parts.timezoneOffset` isn't
 *   supplied.
 * </Alert>
 *
 * @extractdocs
 * @menugroup Time
 */
export function formatTime(parts: TimeParts | Date, options: TimeFormatOptions = {}): string {
    const { locales = [], localeOptions } = options;
    let date = parts;
    if (!(date instanceof Date)) {
        const { hour, minute, second, millisecond, timezoneOffset } = date;
        let timezone;
        if (timezoneOffset != null) {
            const tzM = Math.abs(timezoneOffset) % 60;
            const tzH = (timezoneOffset - tzM) / -60;
            timezone = `${tzH >= 0 ? '+' : ''}${pad(tzH)}:${pad(tzM)}`;
        }
        const str = `${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millisecond, 3)}${
            timezone || ''
        }`;
        date = new Date(`1970-01-01T${str}`);
    }
    return date.toLocaleTimeString(locales, localeOptions);
}
