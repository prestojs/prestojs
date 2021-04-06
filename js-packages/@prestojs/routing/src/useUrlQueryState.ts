// @flow
import isEqual from 'lodash/isEqual';
import pickBy from 'lodash/pickBy';
import qs from 'query-string';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

type Decode = (value: string, paramName: string) => any;
type Encode = (value: any, paramName: string) => string;

type EncodeDecode = [Decode, Encode];

type ParamsEncodeDecode = Record<string, EncodeDecode | Decode>;

/**
 * @expand-properties
 */
type Options = {
    /**
     * An object mapping a key name to either a 2-tuple of a decode & encode function or
     * a single decode function.
     *
     * The decode function is used to parse query values to transform them to a certain type or shape.
     *
     * The encode function is used stringify a value to be stored in the URL. When using the
     * single function form (just the decode function) then the encode function is the equivalent
     * of calling the toString() method on the value.
     *
     * Both encode and decode are passed 2 arguments; the value to transform and the name of the parameter.
     *
     * A special key '*' can be set to define the fallback behaviour for all keys not explicitly defined.
     */
    params?: ParamsEncodeDecode;
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
     * URL. Any other keys will be ignored. If `true` is passed then all the fields specified in `params`
     * will be used as the value (`params` must be supplied in this case).`
     */
    controlledKeys?: Array<string> | true;
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

// Wildcard used to indicate all fields in `params` option
const WILDCARD = '*';

/**
 * Create new object from `obj` without keys `withoutKeys`
 */
const pickWithoutKeys = (
    obj: Record<string, any>,
    withoutKeys: Array<string>
): Record<string, any> => pickBy(obj, (value: any, key: string) => !withoutKeys.includes(key));

function encode(key: string, value: any, params: ParamsEncodeDecode): string {
    const p = params[key] || params[WILDCARD];
    if (!p || !Array.isArray(p)) {
        return value == null ? value : value.toString();
    }
    return p[1](value, key);
}

function decode(key: string, value: any, params: ParamsEncodeDecode): string {
    const p = params[key] || params[WILDCARD];
    if (!p) {
        return value;
    }
    if (Array.isArray(p)) {
        return p[0](value, key);
    }
    return p(value, key);
}

/**
 * Build query params object to set in URL.
 *
 * Prefixes all keys in `obj` with `prefix` and set value to value returned
 * by `stringify`
 */
const buildQueryForUrl = (
    obj: {},
    prefix: string,
    params: ParamsEncodeDecode,
    controlledKeys?: string[] | true
): Record<string, string> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (
            !controlledKeys ||
            (Array.isArray(controlledKeys) ? controlledKeys.includes(key) : key in params)
        ) {
            acc[prefix + key] = encode(key, value, params);
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
    params: ParamsEncodeDecode,
    controlledKeys?: string[] | true,
    initialState?: Record<string, any>
): Record<string, any> => {
    const queryObj = Object.entries(obj).reduce((acc, [key, value]) => {
        if (key.startsWith(prefix)) {
            const unprefixedKey = key.substr(prefix.length);
            if (
                !controlledKeys ||
                (Array.isArray(controlledKeys)
                    ? controlledKeys.includes(unprefixedKey)
                    : unprefixedKey in params)
            ) {
                acc[unprefixedKey] = decode(key, value, params);
            }
        }
        return acc;
    }, {});
    if (Object.keys(queryObj).length === 0) {
        return initialState || {};
    }
    return queryObj;
};

// TODO: Should the default parse actually do something special here? eg. if it's
// 'true' or 'false' transform to bool? if it looks like a number convert to number?
// Date handling?
// TODO: Should stringify have any special cases? Dates? Arrays? Nested objects?

const DEFAULT_PARAMS = {};

/**
 * Use URL query string as state. This is like `useState` except the state value
 * is always an object and the state is stored in the URL.
 *
 * This hook parses the query string and returns that as an object along with a
 * setter function to transition state values. The setter will transition the
 * URL to match the query params specified.
 *
 * As different router integrations handle history and navigation differently you
 * can pass the current location and a function to replace the current URL to options.
 *
 * By default it will work with `window.location` and the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
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
 *   const [urlState, setUrlState] = useUrlQueryState(
 *     { data: { name: 'Dave', email: '' }, count: 1 },
 *     {
 *         params: {
 *             count: value => Number(value),
 *             data: [value => JSON.parse(value), value => JSON.stringify(value)],
 *         },
 *     }
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
 *
 * @extract-docs
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
     * to OR a transition function.
     *
     * A transition function should accept the current state and return the new
     * state (eg. same as `useState`).
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
        prefix = '',
        params = DEFAULT_PARAMS,
        controlledKeys,
        location = typeof window != 'undefined' && window.location,
    } = options;
    if (
        !location ||
        (!options.replaceUrl && typeof window !== 'undefined' && location !== window.location)
    ) {
        throw new Error('The url and replaceUrl options must be provided');
    }
    if (controlledKeys === true && params[WILDCARD]) {
        throw new Error('controlledKeys=true cannot be used with a wildcard in `params`');
    }

    // Only used when using window.location to force render on change
    const [, forceRender] = useReducer(s => !s, false);
    const replaceUrl = useMemo(() => {
        if (options.replaceUrl) {
            return options.replaceUrl;
        }
        if (typeof window !== 'undefined' && location === window.location) {
            return (url: string): void => {
                window.history.pushState(null, '', url);
                forceRender();
            };
        }
        // This should never happen; we check above
        throw new Error('replaceUrl must be specified');
    }, [options.replaceUrl, location]);

    // When using window.location we need to handle back/forward navigation. When this occurs update
    // query params. This is a no-op when not using window.location.
    useEffect(() => {
        if (typeof window !== 'undefined' && location === window.location) {
            const listener = (): void => {
                forceRender();
            };
            window.addEventListener('popstate', listener);
            return (): void => window.removeEventListener('popstate', listener);
        }
    }, [location]);
    const { search, pathname } = location;

    // This effect is used to update URL to include any missing keys that are
    // specified in initialState. It only runs once - any subsequent changes to
    // initialState have no effect.
    useEffect(() => {
        const query = qs.parse(search);
        const invalidKeys: string[] = [];
        const missingKeys = Object.keys(initialState).filter(key => {
            if (
                controlledKeys &&
                !(Array.isArray(controlledKeys) ? controlledKeys.includes(key) : key in params)
            ) {
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
                    ...buildQueryForUrl(initialState, prefix, params, missingKeys),
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
        const query = qs.parse(search);
        const existingQuery = buildQueryForState(
            query,
            prefixCache.current,
            params,
            undefined,
            initialState
        );
        const keys = Object.keys(query).filter(key => key.startsWith(prefixCache.current));
        replaceUrl(
            `${pathname}?${qs.stringify({
                ...pickWithoutKeys(query, keys),
                ...buildQueryForUrl(existingQuery, prefix, params),
            })}`
        );
        prefixCache.current = prefix;
    });

    // Return the current query params without the prefix
    const unPrefixedQueryObject = useMemo(
        () => buildQueryForState(qs.parse(search), prefix, params, controlledKeys, initialState),
        [controlledKeys, search, params, prefix, initialState]
    );

    // Build the state transition callback. This will make sure the URL matches
    // the state specified including removing any values no included in the next
    // state value.
    const setUrlState = useCallback(
        (nextQuery: {}) => {
            const query = qs.parse(search);
            if (typeof nextQuery === 'function') {
                nextQuery = nextQuery(unPrefixedQueryObject);
            }
            let keys;
            if (controlledKeys === true) {
                keys = Object.keys(params).filter(k => k !== WILDCARD);
            } else if (Array.isArray(controlledKeys)) {
                keys = controlledKeys;
            }
            if (!keys) {
                keys = Object.keys(query).filter(key => key.startsWith(prefix));
            }
            if (Array.isArray(controlledKeys)) {
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
                ...buildQueryForUrl(nextQuery, prefix, params, controlledKeys),
            };
            if (!isEqual(finalQuery, query)) {
                replaceUrl(`${pathname}?${qs.stringify(finalQuery)}`);
            }
        },
        [search, controlledKeys, prefix, params, unPrefixedQueryObject, replaceUrl, pathname]
    );

    return [unPrefixedQueryObject, setUrlState];
}
