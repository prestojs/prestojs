import DecimalField from '../DecimalField';

test('DecimalField should return values as is', () => {
    const field = new DecimalField({ label: 'decimal' });
    expect(field.parse('5')).toBe('5');
    expect(field.parse('0.0')).toBe('0.0');
    expect(field.parse('0.02')).toBe('0.02');
    expect(field.parse('0')).toBe('0');
    expect(field.parse('')).toBe(null);
    expect(field.parse(null)).toBe(null);
    expect(field.parse('asdf')).toBe('asdf');
});

test('should be able to pass strings for maxValue & minValue', () => {
    const field = new DecimalField({ minValue: '1.3', maxValue: '2.2' });
    expect(field.minValue).toBe('1.3');
    expect(field.maxValue).toBe('2.2');

    expect(() => new DecimalField({ minValue: 'invalid' })).toThrow();
    expect(() => new DecimalField({ maxValue: 'invalid' })).toThrow();
});
