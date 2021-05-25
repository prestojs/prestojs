import { formatTime, InvalidTimeError, parseTime } from '../time';

test.each([
    '3:55',
    '03:55',
    '3:55:00',
    '03:55:00',
    '3:55:00.000',
    '03:55:00.000',
    '3:55:00.000+10:00',
    '03:55:00.000+10:00',
])('parse %s', time => {
    expect(parseTime(time)).toEqual(
        expect.objectContaining({
            hour: 3,
            minute: 55,
            second: 0,
            millisecond: 0,
        })
    );
});

test('parseTime', () => {
    expect(() => parseTime('24:00')).toThrow(InvalidTimeError);
    expect(() => parseTime('-1:00')).toThrow(InvalidTimeError);
    expect(() => parseTime('23:60')).toThrow(InvalidTimeError);
    expect(() => parseTime('23:59:62')).toThrow(InvalidTimeError);
    expect(parseTime('23:59')).toEqual({
        hour: 23,
        minute: 59,
        second: 0,
        millisecond: 0,
    });
    expect(parseTime('23:59:09')).toEqual({
        hour: 23,
        minute: 59,
        second: 9,
        millisecond: 0,
    });
    expect(parseTime('23:59:09.530')).toEqual({
        hour: 23,
        minute: 59,
        second: 9,
        millisecond: 530,
    });
    expect(parseTime('23:59:09.530+10:00')).toEqual({
        hour: 23,
        minute: 59,
        second: 9,
        millisecond: 530,
        timezoneOffset: -600,
    });
    expect(parseTime(new Date(Date.parse('1970-01-01T06:16:35.720')))).toEqual({
        hour: 6,
        minute: 16,
        second: 35,
        millisecond: 720,
        timezoneOffset: new Date().getTimezoneOffset(),
    });
});

test('formatTime', () => {
    expect(
        formatTime(parseTime('11:30:00.000+09:30'), {
            localeOptions: { timeZone: 'Australia/Adelaide' },
        })
    ).toBe('11:30:00 AM');
    expect(
        formatTime(parseTime('11:30:00.000+09:30'), {
            localeOptions: { timeZone: 'Australia/Melbourne' },
        })
    ).toBe('12:00:00 PM');
    expect(formatTime(parseTime('11:30'))).toBe('11:30:00 AM');
    expect(formatTime(parseTime('22:30:55'))).toBe('10:30:55 PM');
    expect(formatTime(parseTime('11:30:00'), { localeOptions: { timeStyle: 'short' } })).toBe(
        '11:30 AM'
    );
    expect(
        formatTime(new Date(Date.parse('1970-01-01T06:16:35.720+10:00')), {
            localeOptions: { timeZone: 'Australia/Melbourne' },
        })
    ).toBe('6:16:35 AM');
});
