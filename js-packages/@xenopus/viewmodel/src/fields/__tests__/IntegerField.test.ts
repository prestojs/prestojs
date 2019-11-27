import IntegerField from '../IntegerField';

test('IntegerField should parse numeric values as Int', () => {
    const field = new IntegerField({ name: 'integer', label: 'integer' });
    expect(field.parse('5')).toBe(5);
    expect(field.parse('0.0')).toBe(0);
    expect(field.parse('0.1')).toBe(0);
    expect(field.parse('0.9')).toBe(0);
    expect(field.parse('0')).toBe(0);
    expect(field.parse('')).toBe(null);
    expect(field.parse('asdf')).toBe('asdf');
});
