import DateField from '../DateField';

test('DateField parse values correctly', () => {
    const field = new DateField({ name: 'date', label: 'date' });
    expect(field.parse(true)).toBe(null);
    expect(field.parse(null)).toBe(null);
    expect(field.parse(undefined)).toBe(null);

    expect(field.parse('2019-11-11').toISOString()).toBe('2019-11-11T00:00:00.000Z');

    const now = new Date();
    expect(field.parse(now).toISOString()).toBe(now.toISOString());
});
