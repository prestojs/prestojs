import { NamedUrlPatterns, UrlPattern } from '@prestojs/routing';

export default new NamedUrlPatterns({
    'users-detail': new UrlPattern('/api/users/:id/'),
    'users-list': new UrlPattern('/api/users/'),
});
