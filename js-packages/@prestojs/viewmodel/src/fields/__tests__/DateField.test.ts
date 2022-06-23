import DateField from '../DateField';

test('DateField parse values correctly', () => {
    const field = new DateField({ label: 'date' });
    expect(field.parse(true)).toBe(null);
    expect(field.parse(null)).toBe(null);
    expect(field.parse(undefined)).toBe(null);

    expect((field.parse('2019-11-11') as Date).toISOString()).toBe('2019-11-11T00:00:00.000Z');

    const now = new Date();
    expect((field.parse(now) as Date).toISOString()).toBe(now.toISOString());
});

test('should consider distinct date instances with same date as equal', () => {
    const field = new DateField({ label: 'date' });
    const a = field.parse('2019-11-25') as Date;
    const b = field.parse('2019-11-25') as Date;
    const c = field.parse('2019-11-26') as Date;
    const d = field.parse('2018-11-25') as Date;
    const e = field.parse('2019-10-25') as Date;
    // time component ignored
    const f = field.parse('2019-11-25 10:00:58 GMT+0') as Date;
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(field.isEqual(a, b)).toBe(true);
    expect(field.isEqual(a, c)).toBe(false);
    expect(field.isEqual(a, d)).toBe(false);
    expect(field.isEqual(a, e)).toBe(false);
    expect(field.isEqual(a, f)).toBe(true);
    expect(field.isEqual(undefined, undefined)).toBe(true);
});
