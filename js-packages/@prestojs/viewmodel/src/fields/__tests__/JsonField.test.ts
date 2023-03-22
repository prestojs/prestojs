import JsonField, { JSON } from '../JsonField';

test('JsonField should parse valid json inputs as json', () => {
    const field = new JsonField({ label: 'json' });
    expect(field.parse('5' as JSON<string>)).toBe(5);
    expect(field.parse(5 as any as JSON<number>)).toBe(5);
    expect(field.parse(true as any as JSON<boolean>)).toBe(true);
    expect(field.parse('true' as JSON<string>)).toBe(true);
    expect(field.parse('{"a":"b"}' as JSON<string>)).toEqual({ a: 'b' });
    expect(field.parse({ a: 'b' } as any as JSON<Record<string, any>>)).toEqual({ a: 'b' });
    expect(field.parse('{ invalid }')).toBe('{ invalid }');
});

test('JsonField should normalize values', () => {
    const field = new JsonField();
    expect(field.normalize('5' as JSON<string>)).toBe(5);
    expect(field.normalize(5 as any as JSON<number>)).toBe(5);
    expect(field.normalize(true as any as JSON<boolean>)).toBe(true);
    expect(field.normalize('true' as JSON<string>)).toBe(true);
    expect(field.normalize('{"a":"b"}' as JSON<string>)).toEqual({ a: 'b' });
    expect(field.normalize({ a: 'b' } as any as JSON<Record<string, any>>)).toEqual({ a: 'b' });
    expect(() => field.normalize('{ invalid }')).toThrow();
});
