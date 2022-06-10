import viewModelFactory from '../../ViewModelFactory';
import FloatField from '../FloatField';

test('FloatField should parse numeric values as Number', () => {
    const field = new FloatField({ label: 'float' });
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

test('FloatField should normalize incoming values into numbers', () => {
    const TestModel = viewModelFactory(
        {
            id: new FloatField(),
        },
        { pkFieldName: 'id' }
    );

    expect(new TestModel({ id: '1' }).id).toBe(1);
    expect(new TestModel({ id: 2.5 }).id).toBe(2.5);

    expect(() => new TestModel({ id: 'invalid' })).toThrowError(/Invalid value/);
});

test('FloatField should support min/max', () => {
    const field = new FloatField({
        minValue: 0,
        maxValue: 5.5,
    });

    expect(field.getWidgetProps()).toEqual({ min: 0, max: 5.5 });
});
