import BooleanField from '../BooleanField';

test('BooleanField parse values correctly', () => {
    const field = new BooleanField({ label: 'bool' });
    expect(field.parse(true)).toBe(true);
    expect(field.parse(false)).toBe(false);
    expect(field.parse(null)).toBe(false);
    expect(field.parse(undefined)).toBe(false);

    expect(field.parse(5)).toBe(true);
    expect(field.parse(0)).toBe(false);
    expect(field.parse(0.0)).toBe(false);
    expect(field.parse('0')).toBe(true);

    expect(field.parse('')).toBe(false);
});
