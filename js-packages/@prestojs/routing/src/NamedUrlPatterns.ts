import UrlPattern, { ResolveOptions } from './UrlPattern';

type UrlPatternMapping = {
    [urlName: string]: UrlPattern;
};

export class NamedUrlNotFoundError extends Error {
    constructor(name) {
        super(`No url with name '${name}' found`);
    }
}

/**
 * Define a lookup from a name to a URL pattern.
 *
 * Provides shortcut to resolve a pattern based on name.
 *
 * Usage:
 *
 * ```js
 * // urls.js
 * import { NamedUrlPatterns, UrlPattern} from '@prestojs/routing';
 *
 * export default new NamedUrlPatterns({
 *   'user-list': new UrlPattern('/users/'),
 *   'user-detail': new UrlPattern('/users/:id/'),
 * });
 *
 * // ... elsewhere
 * import namedUrls from '../urls.js';
 *
 * namedUrls.resolve('user-list');
 * // /users/
 * namedUrls.resolve('user-detail', { id: 5 }, { query: { showAddresses: true }});
 * // /users/5/?showAddresses=true
 *
 * // Or to get the pattern direclty without resolving URL
 * namedUrls.get('user-list')
 * // UrlPattern('/users/')
 * ```
 *
 * @extract-docs
 */
export default class NamedUrlPatterns {
    urlPatterns: UrlPatternMapping;
    constructor(urls: UrlPatternMapping) {
        const badPatterns = Object.entries(urls).filter(
            ([, pattern]) => !(pattern instanceof UrlPattern)
        );
        if (badPatterns.length > 0) {
            throw new Error(
                `Named patterns must be an instance of UrlPattern. Check named urls: ${badPatterns
                    .map(([name]) => name)
                    .join(', ')}`
            );
        }
        this.urlPatterns = urls;
    }

    /**
     * Get the UrlPattern for the specified name
     * @param name Name of pattern to retrieve
     */
    get(name: string): UrlPattern | null {
        return this.urlPatterns[name];
    }

    /**
     * Reverse a UrlPattern by it's name
     * @param name Name of the pattern to resolve
     * @param kwargs Arguments to replace in pattern, if any
     * @param options Extra options to pass through to `UrlPattern.resolve`
     */
    reverse(name: string, kwargs: {} = {}, options: ResolveOptions = {}): string {
        const url = this.get(name);
        if (!url) {
            throw new NamedUrlNotFoundError(name);
        }

        return url.resolve(kwargs, options);
    }
}
