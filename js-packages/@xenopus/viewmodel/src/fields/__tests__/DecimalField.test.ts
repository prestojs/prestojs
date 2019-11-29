import DecimalField from '../DecimalField';

test('DecimalField should return values as is', () => {
    const field = new DecimalField({ name: 'decimal', label: 'decimal' });
    expect(field.parse('5')).toBe('5');
    expect(field.parse('0.0')).toBe('0.0');
    expect(field.parse('0.02')).toBe('0.02');
    expect(field.parse('0')).toBe('0');
    expect(field.parse('')).toBe(null);
    expect(field.parse(null)).toBe(null);
    expect(field.parse('asdf')).toBe('asdf');
});
