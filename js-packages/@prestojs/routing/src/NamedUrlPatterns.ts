import UrlPattern, { UrlPatternResolveOptions } from './UrlPattern';

type UrlPatternMapping = {
    [urlName: string]: UrlPattern;
};

export class NamedUrlNotFoundError extends Error {
    constructor(name) {
        super(`No url with name '${name}' found`);
    }
}

/**
 * Define a lookup from a name to a [UrlPattern](doc:UrlPattern).
 *
 * This is useful to have a) a central location where all related patterns are defined
 * and b) refer to patterns by a name rather than the URL path directly.
 *
 * ## Usage
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
 * namedUrls.reverse('user-list');
 * // /users/
 * namedUrls.reverse('user-detail', { id: 5 }, { query: { showAddresses: true }});
 * // /users/5/?showAddresses=true
 *
 * // Or to get the pattern directly without resolving URL
 * namedUrls.get('user-list')
 * // UrlPattern('/users/')
 * ```
 *
 * @extractdocs
 * @typeParam Patterns The URL patterns defined as an object where keys are the names and values are a [UrlPattern](doc:UrlPattern)
 */
export default class NamedUrlPatterns<Patterns extends UrlPatternMapping> {
    urlPatterns: Patterns;

    /**
     * @param urls The patterns defined as an object where keys are the names and values are a [UrlPattern](doc:UrlPattern)
     * @typeParam Patterns {@inheritTypeParam NamedUrlPatterns}
     */
    constructor(urls: Patterns) {
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
     * Get the [UrlPattern](doc:UrlPattern) for the specified name
     *
     * @param name Name of pattern to retrieve
     * @paramtypename name string
     */
    get(name: keyof Patterns): UrlPattern {
        const pattern = this.urlPatterns[name];
        if (!pattern) {
            throw new NamedUrlNotFoundError(name);
        }
        return pattern;
    }

    /**
     * Reverse a [UrlPattern](doc:UrlPattern) by its name
     *
     * This is a shortcut for:
     *
     * ```js
     * this.get(name).resolve(kwargs, options)
     * ```
     *
     * @param name Name of the pattern to resolve
     * @param kwargs Arguments to replace in pattern, if any
     * @param options Extra options to pass through to `UrlPattern.resolve`
     * @paramtypename name string
     */
    reverse(name: keyof Patterns, kwargs: {} = {}, options: UrlPatternResolveOptions = {}): string {
        const url = this.get(name);
        return url.resolve(kwargs, options);
    }
}
