/* eslint-disable @typescript-eslint/ban-ts-comment */
import NamedUrlPatterns from '../NamedUrlPatterns';
import UrlPattern from '../UrlPattern';

test('should validate named urls', () => {
    expect(
        () =>
            new NamedUrlPatterns({
                'user-list': new UrlPattern('/users/'),
                // @ts-ignore
                'user-detail': '/users/:id',
                // @ts-ignore
                'user-delete': { pattern: '/users/:id/delete/' },
            })
    ).toThrow(/Named patterns must be an instance of UrlPattern/);
});

test('should be able to reverse named urls', () => {
    const namedUrls = new NamedUrlPatterns({
        'user-list': new UrlPattern('/users/'),
        'user-detail': new UrlPattern('/users/:id/'),
    });

    expect(namedUrls.reverse('user-list')).toBe('/users/');
    expect(namedUrls.reverse('user-list', {}, { query: { pageSize: 2 } })).toBe(
        '/users/?pageSize=2'
    );
    expect(namedUrls.reverse('user-detail', { id: 5 })).toBe('/users/5/');
    expect(() => namedUrls.reverse('user-delete')).toThrowError(
        /No url with name 'user-delete' found/
    );
});
