import UrlPattern from '../UrlPattern';

test('Url.resolve should validate args', () => {
    const urlPattern = new UrlPattern('/test/:name/:id?/');
    expect(() => urlPattern.resolve()).toThrowError(/Missing required arguments: name/);
    expect(() => urlPattern.resolve({ blah: 5 })).toThrowError(/Invalid arguments supplied: blah/);
    expect(urlPattern.resolve({ name: 'bob' })).toBe('/test/bob/');
    expect(urlPattern.resolve({ name: 'bob', id: '5' })).toBe('/test/bob/5/');
});
