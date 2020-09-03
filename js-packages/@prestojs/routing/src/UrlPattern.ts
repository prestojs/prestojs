import { compile, Key, PathFunction, pathToRegexp } from 'path-to-regexp';
import qs from 'query-string';

export interface ResolveOptions {
    query?: {};
}

/**
 * Allows definition of URL as a pattern with ability to resolve it to a URL by performing argument replacement
 *
 * Patterns are defined using the [path-to-regexp](https://github.com/pillarjs/path-to-regexp) library
 *
 * Usage:
 *
 * ```js
 * const url = new UrlPattern('/users/:id/'),
 * url.resolve({ id: 5 });
 * // /users/5/
 * url.resolve({ id: 5 }, { query: { showAddresses: true }});
 * // /users/5/?showAddresses=true
 * ```
 *
 * @extract-docs
 */
export default class UrlPattern {
    pattern: string;
    validArgNames: string[];
    requiredArgNames: string[];
    toPath: PathFunction;
    keys: Key[];

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

    resolve(kwargs: {} = {}, { query }: ResolveOptions = {}): string {
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
        if (query) {
            // TODO: Will need support to change how indices etc are done, eg.
            // https://www.npmjs.com/package/query-string#arrayformat
            // Default option does what we want currently
            // https://github.com/prestojs/prestojs/issues/61
            url = `${url}?${qs.stringify(query)}`;
        }
        return url;
    }
}
