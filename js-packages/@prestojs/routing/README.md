# Routing

Provides base primitives for dealing with routing.

## Define URL Patterns

See [path-to-regexp](https://github.com/pillarjs/path-to-regexp) for more details on
accepted format for pattern definitions.

```js
import { UrlPattern } from '@prestojs/routing';
const userList = new UrlPattern('/users/');
const userDetail = new UrlPattern('/users/:id/');

// Resolve to a URL
userList.resolve();
// /users/
userDetail.resolve({ id: 5 });
// /users/5/
// Optionally add query parameters
url.resolve({ id: 5 }, { query: { showAddresses: true } });
// /users/5/?showAddresses=true
```

## Define named URLs

This allows you to lookup URLs based on a name

```js
// urls.js
import { NamedUrlPatterns, UrlPattern } from '@prestojs/routing';

export default new NamedUrlPatterns({
    'user-list': new UrlPattern('/users/'),
    'user-detail': new UrlPattern('/users/:id/'),
});

// ... elsewhere
import namedUrls from '../urls.js';

namedUrls.resolve('user-list');
// /users/
namedUrls.resolve('user-detail', { id: 5 }, { query: { showAddresses: true } });
// /users/5/?showAddresses=true

// Or to get the pattern direclty without resolving URL
namedUrls.get('user-list');
// UrlPattern('/users/')
```
