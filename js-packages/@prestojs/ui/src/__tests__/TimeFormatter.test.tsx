import TimeFormatter from '../formatters/TimeFormatter';

test('TimeFormatter format times correctly', () => {
    expect(TimeFormatter({ value: null })).toBeNull();
    expect(TimeFormatter({ value: '1' })).toBeNull();
    expect(TimeFormatter({ value: 'midnight' })).toBeNull();
    // we by default does not test locales due to most Node gets built without Intl. If you wish to test locales, install full-icu package and run `NODE_ICU_DATA=node_modules/full-icu jest`.
    expect(TimeFormatter({ value: '11:30' })).toBe('11:30:00 AM');
    expect(TimeFormatter({ value: '22:30' })).toBe('10:30:00 PM');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(TimeFormatter({ value: '11:30:00', localeOptions: { timeStyle: 'short' } })).toBe(
        '11:30 AM'
    );
    expect(TimeFormatter({ value: '11:30:00.123' })).toBe('11:30:00 AM');
});
