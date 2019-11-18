import NumberField from '../NumberField';

test('NumberField should parse numeric values as Number', () => {
    const field = new NumberField({ name: 'number', label: 'number' });
    expect(field.parse('5')).toBe(5);
    expect(field.parse('0.0')).toBe(0);
    expect(field.parse('0')).toBe(0);
    expect(field.parse('')).toBe(null);
    // eg. start type .5
    expect(field.parse('.')).toBe('.');
    expect(field.parse('.5')).toBe(0.5);
    expect(field.parse('5.')).toBe(5);
    expect(field.parse('asdf')).toBe('asdf');
});
