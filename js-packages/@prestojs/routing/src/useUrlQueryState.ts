// @flow
import { useCallback, useEffect, useRef, useMemo } from 'react';
import pickBy from 'lodash/pickBy';
import isEqual from 'lodash/isEqual';
import qs from 'qs';

type Parse = (value: string, paramName: string) => any;
type Stringify = (value: any, paramName: string) => string;

type Options = {
    /**
     * A function used to parse query values to transform them to a certain type or shape.
     *
     * It is passed 2 arguments; the value to transform and the name of the parameter.
     *
     * eg. Calling `setUrlState({ count: 1, name: 'test' });` would call `parse`
     * twice, once with `1, 'count'` and once with `'test', name`.
     */
    parse?: Parse;
    /**
     * A function used to stringify a value to be stored in the URL. If not specified the value's toString() method will be called. This could be useful if needing to store a complex object in the query string.
     *
     * It is passed 2 arguments; the value to stringify and the name of the parameter.
     */
    stringify?: Stringify;
    /**
     * A value to prefix query param keys with. The returned state object
     * contains the un-prefixed keys.
     *
     * If not specified all query params are sync'd. To make this work nicely
     * with other usages of the hook on the same page consider setting
     * `controlledKeys`
     */
    prefix?: string;
    /**
     * If specified only these keys will be synced to and read from the request
     * URL. Any other keys will be ignored.
     */
    controlledKeys?: Array<string>;
    /**
     * The current location. This depends on your router integration.
     */
    location?: {
        search: string;
        pathname: string;
    };
    /**
     * A function that replaces the current url. This depends on your router integration.
     */
    replaceUrl?: (url: string) => void;
};

/**
 * Create new object from `obj` without keys `withoutKeys`
 */
const pickWithoutKeys = (
    obj: Record<string, any>,
    withoutKeys: Array<string>
): Record<string, any> => pickBy(obj, (value: any, key: string) => !withoutKeys.includes(key));

/**
 * Build query params object to set in URL.
 *
 * Prefixes all keys in `obj` with `prefix` and set value to value returned
 * by `stringify`
 */
const buildQueryForUrl = (
    obj: {},
    prefix: string,
    stringify: Stringify,
    controlledKeys?: string[]
): Record<string, string> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (!controlledKeys || controlledKeys.includes(key)) {
            acc[prefix + key] = stringify(value, key);
        }
        return acc;
    }, {});
};

/**
 * Build query param object for use by consumer of hook.
 *
 * Removes prefix `prefix` from all keys in `obj` and sets the value to the
 * value returned by `parse`
 */
const buildQueryForState = (
    obj: Record<string, any>,
    prefix: string,
    parse: Parse,
    controlledKeys?: string[]
): Record<string, any> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (key.startsWith(prefix)) {
            const unprefixedKey = key.substr(prefix.length);
            if (!controlledKeys || controlledKeys.includes(unprefixedKey)) {
                acc[unprefixedKey] = parse(value, key);
            }
        }
        return acc;
    }, {});
};

function identity<T>(a: T): T {
    return a;
}

// TODO: Should the default parse actually do something special here? eg. if it's
// 'true' or 'false' transform to bool? if it looks like a number convert to number?
// Date handling?
// TODO: Should stringify have any special cases? Dates?

/**
 * Use URL query string as state. This is like `useState` except the state value
 * is always an object and the state is stored in the URL.
 *
 * This hook parses the query string and returns that as an object along with a
 * setter function to transition state values. The setter will transition the
 * URL to match the query params specified.
 *
 * As different router integrations handle history and navigation differently you
 * must pass the current location and a function to replace the current URL to options.
 *
 * For react-router:
 *
 * ```js
 * import { useLocation, useHistory } from 'react-router';
 *
 * function useRouterUrlQueryState(initialState = {}, options = {}) {
 *     const location = useLocation();
 *     const history = useHistory();
 *     return useUrlQueryState({}, { location, replaceUrl: history.replace });
 * }
 * ```
 *
 * For navi:
 *
 * ```js
 * import { useUrlQueryState } from '@prestojs/routing';
 * import { useCallback } from 'react';
 * import { useCurrentRoute, useNavigation } from 'react-navi';
 *
 * export default function useNaviUrlQueryState(initialState = {}, options = {}) {
 *    const { url } = useCurrentRoute();
 *    const navigation = useNavigation();
 *    const replaceUrl = useCallback(nextUrl => navigation.navigate(nextUrl, { replace: true }), [
 *        navigation,
 *    ]);
 *    return useUrlQueryState(initialState, {
 *        ...options,
 *        url,
 *        replaceUrl,
 *    });
 * }
 * ```
 *
 * NOTE: Due to the fact that everything in the URL is represented as a string
 * the returned values in the state object will all be strings. Use `options.parse`
 * to do any transforms required on these values.
 *
 * @param {Object} initialState The initial state values. If any of the specified
 * keys don't exist in the URL already the URL will be changed such that they
 * do. If all the keys do exist in the URL already this option has no effect.
 * @param {Options} options @expand
 *
 * @example
 *
 * ```jslive
 * # OPTIONS: {"fakeBrowser": true}
 * function ExampleUrlSync() {
 *   const parse = (c) => Number(c);
 *   const [urlState, setUrlState] = useUrlQueryState({ count: 1 }, { parse });
 *   const onClick = () => setUrlState(s => ({ count: s.count + 1 }));
 *   return (
 *     <Button onClick={onClick}>{urlState.count} Increment</Button>
 *   );
 * }
 * <ExampleUrlSync />
 * ```
 *
 * Same thing but with a prefix:
 *
 * ```jslive
 * # OPTIONS: {"fakeBrowser": true}
 * function ExampleUrlSync() {
 *   const parse = (c) => Number(c);
 *   const [urlState, setUrlState] = useUrlQueryState(
 *     { count: 1 },
 *     { parse, prefix: 'test_' }
 *   );
 *   const onClick = () => setUrlState(s => ({ count: s.count + 1 }));
 *   return (
 *     <Button onClick={onClick}>{urlState.count} Increment</Button>
 *   );
 * }
 * <ExampleUrlSync prefix="p_" />
 * ```
 *
 * Partially control URL query params when no prefix is set
 * ```jslive
 * # OPTIONS: {"fakeBrowser": "/?name=test&page=1&count=5"}
 * function ExampleUrlSyncControlled() {
 *   const parse = (c) => Number(c);
 *   const [urlState, setUrlState] = useUrlQueryState(
 *     { count: 1 },
 *     { parse, controlledKeys: ['count'] }
 *   );
 *   const onClick = () => setUrlState(s => ({ count: s.count + 1 }));
 *   return (
 *     <Button onClick={onClick}>{urlState.count} Increment</Button>
 *   );
 * }
 * <ExampleUrlSyncControlled />
 * ```
 *
 * Advanced parse & stringify
 *
 * ```jslive
 * # OPTIONS: {"fakeBrowser": true }
 * function ExampleUrlSyncControlled() {
 *   const parse = (value, key) => {
 *       if (key === 'count') {
 *           return Number(value);
 *       }
 *       if (key === 'data') {
 *           return JSON.parse(value);
 *       }
 *       return value;
 *   }
 *   const stringify = (value, key) => {
 *       if (key === 'data') {
 *           return JSON.stringify(value);
 *       }
 *       return value;
 *   }
 *   const [urlState, setUrlState] = useUrlQueryState(
 *     { data: { name: 'Dave', email: '' }, count: 1 },
 *     { parse, stringify }
 *   );
 *   const onClick = () => setUrlState(s => ({ ...s, count: s.count + 1 }));
 *   const { data = {} } = urlState;
 *   return (
 *     <div>
 *        <input
 *          value={data.name}
 *          onChange={({ target: { value }}) => setUrlState(s => ({
 *            ...s,
 *            data: { ...s.data, name: value },
 *          }))}
 *        />
 *        <input
 *          value={data.email}
 *          onChange={({ target: { value }}) => setUrlState(s => ({
 *            ...s,
 *            data: { ...s.data, email: value },
 *          }))}
 *        />
 *        <Button onClick={onClick}>{urlState.count} Increment</Button>
 *        <hr />
 *        State:
 *        <pre>
 *            {JSON.stringify(urlState, null, 2)}
 *        </pre>
 *     </div>
 *   );
 * }
 * <ExampleUrlSyncControlled />
 * ```
 */
export default function useUrlQueryState(
    initialState: {} = {},
    options: Options = {}
): [
    /**
     * The current query state
     *
     * If `options.prefix` is specified this contains only query param keys that
     * start with the prefix otherwise it contains _all_ query params.
     */
    Record<string, any>,
    /**
     * State transition function. Accepts either the state object to transition
     * to OR a function that is passed the current state and should return the
     * new state to transition to.
     *
     * The state specified always replaces the current state - it is not merged
     * except with the caveats noted below.
     *
     * As the URL could be used by multiple hooks or other components the following
     * are the rules that are applied when determining what to keep in the URL:
     *
     * If `options.controlledKeys` is not specified then any query param keys
     * that match the specified list will be removed if not included in the new
     * state object. Any keys not in the specified list will be retained.
     *
     * If `options.controlledKeys` is not specified and `options.prefix` is specified
     * then any query param keys that start with the prefix will be removed if
     * not included in the new state object. Any keys not starting with `prefix` will
     * be retained.
     *
     * If `options.controlledKeys` and `options.prefix` are not specified then
     * query param keys not included in the new state object will be removed.
     *
     * @example
     *
     * Pass object directly
     *
     * ```js
     * const [urlState, setUrlState] = useUrlQueryState();
     * const onPaginationChange = (page, pageSize) => {
     *     setUrlState({ page, pageSize});
     * };
     * ```
     *
     * Pass callback that gets current state
     * ```js
     * const [urlState, setUrlState] = useUrlQueryState({ page: 1 });
     * const onNextPage = () => {
     *     setUrlState(currentState => ({
     *         ...currentState,
     *         page: currentState.page + 1,
     *     });
     * };
     * ```
     */
    (
        value: Record<string, any> | ((currentQuery: Record<string, any>) => Record<string, any>)
    ) => void
] {
    const {
        parse = identity,
        stringify = identity,
        prefix = '',
        controlledKeys,
        location = typeof window != 'undefined' && window.location,
        replaceUrl = typeof window != 'undefined' &&
            ((url: string): void => window.history.pushState(null, '', url)),
    } = options;
    if (!location || !replaceUrl) {
        throw new Error('The url and replaceUrl options must be provided');
    }
    const { search, pathname } = location;

    // This effect is used to update URL to include any missing keys that are
    // specified in initialState. It only runs once - any subsequent changes to
    // initialState have no effect.
    useEffect(() => {
        const query = qs.parse(search, { ignoreQueryPrefix: true });
        const invalidKeys: string[] = [];
        const missingKeys = Object.keys(initialState).filter(key => {
            if (controlledKeys && !controlledKeys.includes(key)) {
                invalidKeys.push(key);
                return false;
            }
            return !(prefix + key in query);
        });
        if (invalidKeys.length) {
            // eslint-disable-next-line no-console
            console.warn(
                `'controlledKeys' is specified but you passed keys to initialState that aren't valid: ${invalidKeys.join(
                    ','
                )}\nEither remove these keys from initialState or add them to 'controlledKeys'`
            );
        }
        if (missingKeys.length > 0) {
            replaceUrl(
                `${pathname}?${qs.stringify({
                    ...buildQueryForUrl(initialState, prefix, stringify, missingKeys),
                    ...query,
                })}`
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // This effect is used to handle a change in prefix. It updates any query
    // params with old prefix to have new prefix.
    const prefixCache = useRef(prefix);
    useEffect(() => {
        // If prefix hasn't changed then don't do anything. This will always be
        // the case the first render. Subsequent renders we bail out if hasn't
        // changed. We use this rather than the dependency array as even with
        // the dep array it will still run the first time - we have to handle it
        // anyway.
        if (prefixCache.current === prefix) {
            return;
        }
        const query = qs.parse(search, { ignoreQueryPrefix: true });
        const existingQuery = buildQueryForState(query, prefixCache.current, parse);
        const keys = Object.keys(query).filter(key => key.startsWith(prefixCache.current));
        replaceUrl(
            `${pathname}?${qs.stringify({
                ...pickWithoutKeys(query, keys),
                ...buildQueryForUrl(existingQuery, prefix, stringify),
            })}`
        );
        prefixCache.current = prefix;
    });

    // Return the current query params without the prefix
    const unPrefixedQueryObject = useMemo(
        () =>
            buildQueryForState(
                qs.parse(search, { ignoreQueryPrefix: true }),
                prefix,
                parse,
                controlledKeys
            ),
        [controlledKeys, search, parse, prefix]
    );

    // Build the state transition callback. This will make sure the URL matches
    // the state specified including removing any values no included in the next
    // state value.
    const setUrlState = useCallback(
        (nextQuery: {}) => {
            const query = qs.parse(search, { ignoreQueryPrefix: true });
            if (typeof nextQuery === 'function') {
                nextQuery = nextQuery(unPrefixedQueryObject);
            }
            const keys = controlledKeys || Object.keys(query).filter(key => key.startsWith(prefix));
            if (controlledKeys) {
                const invalidKeys = Object.keys(nextQuery).filter(
                    key => !controlledKeys.includes(key)
                );
                if (invalidKeys.length > 0) {
                    // eslint-disable-next-line no-console
                    console.warn(
                        `'controlledKeys' is specified but you passed keys to setUrlState that aren't valid: ${invalidKeys.join(
                            ','
                        )}\nEither remove these keys or add them to 'controlledKeys'`
                    );
                }
            }
            const finalQuery = {
                ...pickWithoutKeys(query, keys),
                ...buildQueryForUrl(nextQuery, prefix, stringify, controlledKeys),
            };
            if (!isEqual(finalQuery, query)) {
                replaceUrl(`${pathname}?${qs.stringify(finalQuery)}`);
            }
        },
        [search, controlledKeys, prefix, stringify, unPrefixedQueryObject, replaceUrl, pathname]
    );

    return [unPrefixedQueryObject, setUrlState];
}
