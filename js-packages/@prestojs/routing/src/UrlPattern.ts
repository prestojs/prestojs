import { compile, Key, PathFunction, pathToRegexp } from 'path-to-regexp';
import qs from 'query-string';

/**
 * @expand-properties
 */
export interface ResolveOptions {
    /**
     * Any query parameters to include in the URL
     *
     * eg. `{ showAddresses: true, section: 'billing' }` would become
     * `?showAddresses=true&section=billing`
     */
    query?: { [key: string]: any };
}

/**
 * Allows definition of URL as a pattern with ability to resolve it to a URL by performing argument replacement
 *
 * Patterns are defined using the [path-to-regexp](https://github.com/pillarjs/path-to-regexp) library
 *
 * ## Usage
 *
 * ```js
 * const url = new UrlPattern('/users/:id/');
 * url.resolve({ id: 5 });
 * // /users/5/
 * url.resolve({ id: 5 }, { query: { showAddresses: true }});
 * // /users/5/?showAddresses=true
 * ```
 *
 * Arguments can be optional:
 *
 * ```js
 * const url = new UrlPattern('/users/:id/:section?');
 * url.resolve({ id: 5 })
 * // /users/5/
 * url.resolve({ id: 6, section: 'addresses' })
 * // /users/5/addresses/
 * ```
 *
 * @extract-docs
 */
export default class UrlPattern {
    /**
     * The original pattern that was passed in
     */
    pattern: string;
    /**
     * Array of all valid argument names. eg. for `/user/:id/:section?` this would be
     * `['id', 'section']`
     */
    validArgNames: string[];
    /**
     * Array of all required argument names. eg. for `/user/:id/:section?` this would be
     * `['id']`
     */
    requiredArgNames: string[];
    private toPath: PathFunction;
    private keys: Key[];

    /**
     * @param pattern See [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters) for the accepted
     * values that can be passed.
     */
    constructor(pattern: string) {
        this.keys = [];
        pathToRegexp(pattern, this.keys);
        this.validArgNames = this.keys.map(key => key.name.toString());
        this.requiredArgNames = this.keys
            .filter(key => !key.modifier.includes('?'))
            .map(key => key.name.toString());
        this.pattern = pattern;
        this.toPath = compile(pattern);
    }

    /**
     * Resolve the pattern into a URL.
     *
     * ```js
     * const pattern = new UrlPattern('/users/:id/:section?');
     * url.resolve({ id: 5 })
     * // /users/5/
     * url.resolve({ id: 6, section: 'addresses' })
     * // /users/5/addresses/
     * ```
     *
     * @param kwargs The arguments to resolve in the pattern. For example if the pattern was
     * `/users/:id/:section?` you would need to pass at least `id` and optionally `section`:
     * `pattern.resolve({id: 5})`
     */
    resolve(kwargs: {} = {}, options: ResolveOptions = {}): string {
        const { query } = options;
        if (kwargs) {
            const invalidArgs = Object.keys(kwargs).filter(
                arg => !this.validArgNames.includes(arg)
            );
            if (invalidArgs.length) {
                if (this.validArgNames.length === 0) {
                    throw new Error(
                        `Invalid arguments supplied: ${invalidArgs.join(
                            ', '
                        )}. This URL pattern accepts no replacement arguments.`
                    );
                }
                throw new Error(
                    `Invalid arguments supplied: ${invalidArgs.join(
                        ', '
                    )}. Valid options are: ${this.validArgNames.join(', ')}`
                );
            }
        }
        const missingArgs = this.requiredArgNames.filter(argName => !(argName in kwargs));
        if (missingArgs.length) {
            throw new Error(`Missing required arguments: ${missingArgs.join(', ')}.`);
        }
        let url = this.toPath(kwargs);
        if (query && Object.keys(query).length > 0) {
            // TODO: Will need support to change how indices etc are done, eg.
            // https://www.npmjs.com/package/query-string#arrayformat
            // Default option does what we want currently
            // https://github.com/prestojs/prestojs/issues/61
            url = `${url}?${qs.stringify(query)}`;
        }
        return url;
    }
}
