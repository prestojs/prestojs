import UrlPattern from '../UrlPattern';

test('Url.resolve should validate args', () => {
    const urlPattern = new UrlPattern('/test/:name/:id?/');
    expect(() => urlPattern.resolve()).toThrowError(/Missing required arguments: name/);
    expect(() => urlPattern.resolve({ blah: 5 })).toThrowError(/Invalid arguments supplied: blah/);
    expect(urlPattern.resolve({ name: 'bob' })).toBe('/test/bob/');
    expect(urlPattern.resolve({ name: 'bob', id: '5' })).toBe('/test/bob/5/');
});

test('should support baseUrl', () => {
    const urlPattern = new UrlPattern('/test/:name/', { baseUrl: 'http://www.examaple.com' });
    expect(urlPattern.resolve({ name: 'bob' })).toBe('http://www.examaple.com/test/bob/');
    expect(urlPattern.resolve({ name: 'bob' }, { baseUrl: 'http://somewhere.else/' })).toBe(
        'http://somewhere.else/test/bob/'
    );
    expect(urlPattern.resolve({ name: 'bob' }, { baseUrl: null })).toBe('/test/bob/');
});

test('should support query', () => {
    const urlPattern = new UrlPattern('/test/:name/', { query: { a: 1 } });
    expect(urlPattern.resolve({ name: 'bob' })).toBe('/test/bob/?a=1');
    expect(urlPattern.resolve({ name: 'bob' }, { query: { b: 2 } })).toBe('/test/bob/?a=1&b=2');
    expect(urlPattern.resolve({ name: 'bob' }, { query: { b: 2 }, mergeQuery: false })).toBe(
        '/test/bob/?b=2'
    );
    expect(urlPattern.resolve({ name: 'bob' }, { baseUrl: 'http://example.com/' })).toBe(
        'http://example.com/test/bob/?a=1'
    );
    expect(
        urlPattern.resolve({ name: 'bob' }, { baseUrl: 'http://example.com/', query: { a: 5 } })
    ).toBe('http://example.com/test/bob/?a=5');

    const urlPattern2 = new UrlPattern('/test/:name/', { query: { a: 1 }, mergeQuery: false });
    expect(urlPattern2.resolve({ name: 'bob' })).toBe('/test/bob/?a=1');
    expect(urlPattern2.resolve({ name: 'bob' }, { query: { b: 2 } })).toBe('/test/bob/?b=2');
    expect(urlPattern2.resolve({ name: 'bob' }, { query: { b: 2 }, mergeQuery: true })).toBe(
        '/test/bob/?a=1&b=2'
    );
});
