import { NamedUrlPatterns, UrlPattern } from '@prestojs/routing';

export default new NamedUrlPatterns({
    'users-detail': new UrlPattern('/api/users/:id/'),
    'users-list': new UrlPattern('/api/users/'),
    home: new UrlPattern('/', 'Home'),
    users: new UrlPattern('/users/', 'Users list', 'home'),
    'user-detail': new UrlPattern('/users/:id/', 'user ${id}', 'users'), // eslint-disable-line
});
