import TimeFormatter from '../formatters/TimeFormatter';

test('TimeFormatter format times correctly', () => {
    expect(TimeFormatter({ value: null })).toBeNull();
    expect(TimeFormatter({ value: '1' })).toBeNull();
    expect(TimeFormatter({ value: 'midnight' })).toBeNull();
    // freaking node js is by default built with intl = US *only*. we can't test other locale options because not everyone will have a custom built node.
    expect(TimeFormatter({ value: '11:30' })).toBe('11:30:00 AM');
    expect(TimeFormatter({ value: '22:30' })).toBe('10:30:00 PM');
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(TimeFormatter({ value: '11:30:00 AM', localeOptions: { timeStyle: 'short' } })).toBe(
        '11:30 AM'
    );
});
