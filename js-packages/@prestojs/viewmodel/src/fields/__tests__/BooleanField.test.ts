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

test('BooleanField(blank=true) parse values like bool, except undefined and null are parsed as null', () => {
    const field = new BooleanField({ blank: true });
    expect(field.parse(true)).toBe(true);
    expect(field.parse(false)).toBe(false);
    expect(field.parse(null)).toBe(null);
    expect(field.parse(undefined)).toBe(null);

    expect(field.parse(5)).toBe(true);
    expect(field.parse(0)).toBe(false);
    expect(field.parse(0.0)).toBe(false);
    expect(field.parse('0')).toBe(true);

    expect(field.parse('')).toBe(false);
});
