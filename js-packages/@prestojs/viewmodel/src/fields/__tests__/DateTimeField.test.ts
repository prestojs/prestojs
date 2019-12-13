import DateTimeField from '../DateTimeField';

test('DateTimeField parse values correctly', () => {
    const field = new DateTimeField({ label: 'datetime' });
    expect(field.parse(true)).toBe(null);
    expect(field.parse(null)).toBe(null);
    expect(field.parse(undefined)).toBe(null);

    expect((field.parse('2019-11-11 11:11:11 GMT+0') as Date).toISOString()).toBe(
        '2019-11-11T11:11:11.000Z'
    );

    const now = new Date();
    expect((field.parse(now) as Date).toISOString()).toBe(now.toISOString());
});
