import Field from '../Field';
import ListField from '../ListField';

class TestField extends Field<string> {
    parse(value): string {
        return value.toLowerCase();
    }
    format(value): string {
        return value.toUpperCase();
    }
    normalize(value): string {
        return value.toString();
    }
}

test('ListField call normalize correctly', () => {
    const field = new ListField({ childField: new TestField() });
    expect(field.normalize(null)).toEqual([]);
    expect(field.normalize([])).toEqual([]);
    expect(field.normalize([1, 2])).toEqual(['1', '2']);
});

test('ListField parse values correctly', () => {
    const field = new ListField({ childField: new TestField() });
    expect(field.parse(null)).toEqual([]);
    expect(field.parse([])).toEqual([]);
    expect(field.parse(['A', 'B'])).toEqual(['a', 'b']);
});

test('ListField formats values correctly', () => {
    const field = new ListField({ childField: new TestField() });
    expect(field.format([])).toEqual([]);
    expect(field.format(['a', 'b'])).toEqual(['A', 'B']);
});

test('ListField sets defaultValue', () => {
    const field1 = new ListField({ childField: new TestField(), blankAsNull: false });
    expect(field1.defaultValue).toEqual([]);
    const field2 = new ListField({ childField: new TestField(), blankAsNull: true });
    expect(field2.defaultValue).toBe(null);
});

test('ListField supports blankAsNull', () => {
    const field = new ListField({ childField: new TestField(), blankAsNull: true });
    expect(field.defaultValue).toBe(null);
    expect(field.parse(null)).toEqual(null);
    expect(field.parse([])).toEqual(null);
    expect(field.parse(['A', 'B'])).toEqual(['a', 'b']);

    expect(field.normalize(null)).toEqual(null);
    expect(field.normalize([])).toEqual(null);
});
