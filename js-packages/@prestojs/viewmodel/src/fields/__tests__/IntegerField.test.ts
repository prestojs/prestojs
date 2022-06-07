import viewModelFactory from '../../ViewModelFactory';
import IntegerField from '../IntegerField';

test('IntegerField should parse numeric values as Int', () => {
    const field = new IntegerField({ label: 'integer' });
    expect(field.parse('5')).toBe(5);
    expect(field.parse('0.0')).toBe(0);
    expect(field.parse('0.1')).toBe(0);
    expect(field.parse('0.9')).toBe(0);
    expect(field.parse('0')).toBe(0);
    expect(field.parse('')).toBe(null);
    expect(field.parse('asdf')).toBe('asdf');
});

test('IntegerField should normalize incoming values into numbers', () => {
    const TestModel = viewModelFactory(
        {
            id: new IntegerField(),
        },
        { pkFieldName: 'id' }
    );

    expect(new TestModel({ id: '1' }).id).toBe(1);
    expect(new TestModel({ id: 2.5 }).id).toBe(2);

    expect(() => new TestModel({ id: 'invalid' })).toThrowError(/Invalid value/);
});
