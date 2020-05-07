import { UrlPattern } from '@prestojs/routing';
import isEqual from 'lodash/isEqual';
import defaultGetPaginationState from './getPaginationState';
import InferredPaginator from './InferredPaginator';
import { PaginatorInterface, PaginatorInterfaceClass } from './Paginator';

type ExecuteInitOptions = Omit<RequestInit, 'headers'> & {
    /**
     * Any headers to add to the request. You can unset default headers that might be specified in the default
     * `Endpoint.defaultConfig.requestInit` by setting the value to `undefined`.
     */
    headers?: HeadersInit | Record<string, undefined | string>;
    /**
     * The paginator instance to use. This can be provided in the constructor to use by default for all executions
     * of this endpoint or provided for each call to the endpoint.
     */
    paginator?: PaginatorInterface | null;
};

/**
 * @expand-properties Any options accepted by [fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) in addition to those described below
 */
type EndpointOptions = ExecuteInitOptions & {
    /**
     * Method to decode body based on response. The default implementation looks at the content type of the
     * response and processes it accordingly (eg. handles JSON and text responses) and is suitable for most cases.
     * If you just need to transform the decoded body (eg. change the decoded JSON object) then use `transformResponseBody`
     * instead.
     */
    decodeBody?: (res: Response) => any;
    /**
     * If provided the value returned from `decodeBody` is passed to this function. If you need to do something
     * with the decoded body (eg. change the shape of the returned JSON) then use this function rather than
     * `decodeBody`. In most cases the default `decodeBody` is suitable.
     * @param data
     */
    transformResponseBody?: (data: any) => any;
};

type UrlResolveOptions = {
    urlArgs?: Record<string, any>;
    query?: Record<string, boolean | string | null | number>;
};

/**
 * @expand-properties
 */
export type ExecuteReturnVal<T> = {
    /**
     * The url that the endpoint was called with
     */
    url: string;
    /**
     * Any arguments that were used to resolve the URL.
     */
    urlArgs?: Record<string, any>;
    /**
     * Any query string parameters
     */
    query?: Record<string, boolean | string | null | number>;
    /**
     * The options used to execute the endpoint with
     */
    requestInit: ExecuteInitOptions;
    /**
     * The response as returned by fetch
     */
    response?: Response;
    /**
     * The value returned by `decodedBody`
     */
    decodedBody?: any;
    /**
     * The value returned by `transformResponseBody` (if provided). If `transformResponseBody` hasn't been provided
     * then this will be the same as `decodedBody`.
     */
    result: T | null;
};

export type EndpointExecuteOptions = ExecuteInitOptions & UrlResolveOptions;

/**
 * Merge two Headers instances together
 */
function mergeHeaders(headers1: Headers, headers2: Headers): Headers {
    headers2.forEach((value, key) => {
        headers1.set(key, value);
    });
    return headers1;
}

/**
 * Given multiple RequestInit objects merge them into a single RequestInit merging headers
 * from each one. Does not merge body. The last object passed with the value set takes
 * precedence.
 *
 * @param args
 */
function mergeRequestInit(...args: ExecuteInitOptions[]): RequestInit {
    return args.reduce((acc: RequestInit, init) => {
        const { headers: currentHeaders, ...rest } = init;
        Object.assign(acc, rest);
        if (currentHeaders) {
            const headersToDelete: string[] = [];
            let headersToAssign: HeadersInit;
            if (!(currentHeaders instanceof Headers)) {
                const entries = Array.isArray(currentHeaders)
                    ? currentHeaders
                    : Object.entries(currentHeaders);
                const filteredEntries: HeadersInit = [];
                for (const [key, value] of entries) {
                    if (value === undefined) {
                        headersToDelete.push(key);
                    } else {
                        filteredEntries.push([key, value]);
                    }
                }
                headersToAssign = new Headers(filteredEntries);
            } else {
                headersToAssign = currentHeaders;
            }
            const mergedHeaders: Headers = mergeHeaders(
                new Headers(acc.headers || {}),
                headersToAssign
            );
            headersToDelete.forEach(key => mergedHeaders.delete(key));
            acc.headers = mergedHeaders;
        }
        return acc;
    }, {});
}

// If we pass an object to useSWR it uses it as the key but if we pass a function (eg. execute) then
// it will call that to generate the key... which is not what we want
class PreparedAction {
    action: Endpoint;
    options: EndpointExecuteOptions;
    urlResolveOptions: UrlResolveOptions;

    constructor(
        action: Endpoint,
        urlResolveOptions: UrlResolveOptions,
        options: ExecuteInitOptions
    ) {
        this.action = action;
        this.options = options;
        this.urlResolveOptions = urlResolveOptions;
    }

    execute(init: ExecuteInitOptions = {}): Promise<any> {
        // TODO: This means that if this.options or init tries to remove
        // a default header by setting it to undefined it will not work
        // as the resulting object is a `Headers` instance that has had
        // the key removed from it already... but then in execute in Endpoint
        // we merge it with the defaultConfig
        return this.action.execute({
            ...this.urlResolveOptions,
            ...mergeRequestInit(this.options, init),
        });
    }
}

/**
 * Indicates a response outside the 200 range
 *
 * @menu-group Endpoint
 * @extract-docs
 */
export class ApiError extends Error {
    status: number;
    statusText: string;
    content: any;

    /**
     * @param status response status code
     * @param statusText HTTP status code message
     * @param content the contents returned by server as processed be decodeBody
     */
    constructor(status: number, statusText: string, content: any) {
        super();
        this.status = status;
        this.statusText = statusText;
        this.content = content;
        this.message = `${status} - ${statusText}`;
    }
}

export class RequestError extends Error {}

/**
 * Decode body and return content based on Content-Type
 *
 * If type includes 'json' (eg. application/json) returns decoded json
 * If type includes 'text (eg. text/plain, text/html) returns text
 * If status is 204 or 205 will return null
 *
 * Otherwise Response object itself is returned
 * @param response
 */
function defaultDecodeBody(response: Response): Response | Record<string, any> | string | null {
    const contentType = response.headers.get('Content-Type');
    const emptyCodes = [204, 205];

    if (emptyCodes.includes(response.status)) {
        return null;
    }

    if (contentType && contentType.includes('json')) {
        return response.json();
    }

    if (contentType && contentType.includes('text')) {
        return response.text();
    }

    // TODO: Do we bother handling blob types? eg. response.blob() if image/* etc

    return response;
}

/**
 * Describe an REST API endpoint that can then be executed.
 *
 * Accepts a `UrlPattern` and optionally a `decodeBody` function which decodes the `Response` body as returned by
 * `fetch` and a `transformResponseBody` function that can transform the decoded body. The default `decodeBody` handles
 * decoding the data based on content type and is suitable for endpoints that return JSON or text with the appropriate
 * content types. If you just wish to do something with the decoded data (eg. the JSON data) use `transformResponseBody`.
 *
 * In addition you can pass all options accepted by `fetch` and these will be used as defaults to any call to `execute`
 * or `prepare`.
 *
 * Usage:
 *
 * ```js
 * const userList = new Action(new UrlPattern('/api/users/'));
 * const users = await userList.execute();
 * ```
 *
 * You can pass `urlArgs` and `query` to resolve the URL:
 *
 * ```js
 * const userDetail = new Action(new UrlPattern('/api/user/:id/'));
 * // Resolves to /api/user/1/?showAddresses=true
 * const user = await userDetail.execute({ urlArgs: { id: 1 }, query: 'showAddresses': true });
 * ```
 *
 * You can also pass through any `fetch` options to both the constructor and calls to `execute` and `prepare`
 *
 * ```js
 * // Always pass through Content-Type header to all calls to userDetail
 * const userDetail = new Action(new UrlPattern('/api/user/:id/'), {
 *     'Content-Type': 'application/json'
 * });
 * // Set other fetch options at execution time
 * userDetail.execute({ urlArgs: { id: 1 }, method: 'PATCH', body: JSON.stringify({ name: 'Dave' }) });
 * ```
 *
 * Often you have some global options you want to apply everywhere. This can be set on `Endpoint`
 * directly:
 *
 * ```js
 * // Set default options to pass through to the request init option of `fetch`
 * Endpoint.defaultConfig.requestInit = {
 *   headers: {
 *     'X-CSRFToken': getCsrfToken(),
 *   },
 * };
 *
 * // All actions will now use the default headers specified
 * userDetail.execute({ urlArgs: { id: 1 } });
 * ```
 *
 * You can also "prepare" an action for execution by calling the `prepare` method. Each call to prepare will
 * return the same object (ie. it passes strict equality checks) given the same parameters. This is useful when
 * you need to have a stable cache key for an action. For example you may have a React hook that executes
 * your action when things change:
 *
 * ```js
 * import useSWR from 'swr';
 *
 * ...
 *
 * // prepare the action and pass it to useSWR. useSWR will then call the second parameter (the "fetcher")
 * // which executes the prepared action.
 * const { data } = useSWR([action.prepare()], (preparedAction) => preparedAction.execute());
 * ```
 *
 * You can wrap this up in a custom hook to make usage more ergonomic:
 *
 * ```js
 * import { useCallback } from 'react';
 * import useSWR from 'swr';
 *
 * // Wrapper around useSWR for use with `Endpoint`
 * // @param action Endpoint to execute. Can be null if not yet ready to execute
 * // @param args Any args to pass through to `prepare`
 * // @return Object Same values as returned by useSWR with the addition of `execute` which
 * // can be used to execute the action directly, optionally with new arguments.
 * export default function useEndpoint(action, args) {
 *   const preparedAction = action ? action.prepare(args) : null;
 *   const execute = useCallback(init => preparedAction.execute(init), [preparedAction]);
 *   return {
 *     execute,
 *     ...useSWR(preparedAction && [preparedAction], act => act.execute()),
 *   };
 * }
 * ```
 *
 * ## Pagination
 *
 * Pagination for an endpoint is handled by a `Paginator` class returned from the `getPaginatorClass` method. The base
 * `Endpoint` class defaults to using no pagination. [PaginatedEndpoint](doc:PaginatedEndpoint) is provided with a
 * default implementation that chooses the paginator based on the shape of the response (eg. if the response looks like
 * cursor based paginator it will use `CursorPaginator`, if page number based `PageNumberPaginator` or if limit/offset
 * use `LimitOffsetPaginator` - see [InferredPaginator](doc:InferredPaginator). The pagination state as returned by the
 * backend is stored on the instance of the paginator:
 *
 * ```js
 * const paginator = usePaginator(endpoint);
 * // This returns the page of results
 * const results = await endpoint.execute({ paginator });
 * // This now has the total number of records (eg. if the paginator was PageNumberPaginator)
 * paginator.total
 * ```
 *
 * You can calculate the next request state by mutating the paginator:
 *
 * ```js
 * paginator.next()
 * // The call to endpoint here will include the modified page request data, eg. ?page=2
 * const results = await endpoint.execute({ paginator });
 * ```
 *
 * See `usePaginator` for more details about how to use a paginator in React.
 *
 * @menu-group Endpoint
 * @extract-docs
 */
export default class Endpoint<
    ReturnT = any,
    PaginatorT extends PaginatorInterface = PaginatorInterface
> {
    static defaultConfig: {
        requestInit: RequestInit;
        getPaginationState: (
            paginator: PaginatorInterface,
            executeReturnVal: ExecuteReturnVal<any>
        ) => Record<string, any> | false;
        paginatorClass: PaginatorInterfaceClass;
    } = {
        requestInit: {},
        getPaginationState: defaultGetPaginationState,
        paginatorClass: InferredPaginator,
    };

    urlPattern: UrlPattern;
    transformResponseBody?: (data: any) => any;
    urlCache: Map<string, Map<{}, PreparedAction>>;
    decodeBody: (res: Response) => any;
    requestInit: ExecuteInitOptions;

    /**
     * @param urlPattern The [UrlPattern](doc:UrlPattern) to use to resolve the URL for this endpoint
     */
    constructor(urlPattern: UrlPattern, options: EndpointOptions = {}) {
        const { decodeBody = defaultDecodeBody, transformResponseBody, ...requestInit } = options;
        this.urlPattern = urlPattern;
        this.transformResponseBody = transformResponseBody;
        this.urlCache = new Map();
        this.decodeBody = decodeBody;
        this.requestInit = requestInit;
    }

    /**
     * Get the Paginator class to use for this endpoint.
     *
     * `Endpoint` defaults to no paginator. See [PaginatedEndpoint](doc:PaginatedEndpoint)
     * for class that provides default paginator.
     */
    getPaginatorClass(): PaginatorInterfaceClass<PaginatorT> {
        const cls = Object.getPrototypeOf(this).constructor;
        return cls.defaultConfig.paginatorClass;
    }

    /**
     * Prepare an action for execution. Given the same parameters returns the same object. This is useful
     * when using libraries like `useSWR` that accept a parameter that identifies a request and is used
     * for caching but execution is handled by a separate function.
     *
     * For example to use with `useSWR` you can do:
     *
     * ```js
     * const { data } = useSWR([action.prepare()], (preparedAction) => preparedAction.execute());
     * ```
     *
     * If you just want to call the action directly then you can bypass `prepare` and just call `execute`
     * directly.
     */
    prepare(options: EndpointExecuteOptions = {}): PreparedAction {
        if (options.paginator) {
            options = options.paginator.getRequestInit(options);
        }
        const { urlArgs = {}, query, paginator, ...init } = options;
        const url = this.urlPattern.resolve(urlArgs, { query });
        let cache = this.urlCache.get(url);
        if (!cache) {
            cache = new Map();
            this.urlCache.set(url, cache);
        }
        for (const [key, value] of cache.entries()) {
            if (isEqual(key, init)) {
                return value;
            }
        }
        const execute = new PreparedAction(this, { urlArgs, query }, { ...init, paginator });
        cache.set(init, execute);
        return execute;
    }

    /**
     * Triggers the `fetch` call for an action
     *
     * This can be called directly or indirectly via `prepare`.
     *
     * If the fetch call itself fails (eg. a network error) a `RequestError` will be thrown.
     *
     * If the response is a non-2XX response an `ApiError` will be thrown.
     *
     * If the call is successful the body will be decoded using `decodeBody`. The default implementation
     * will decode JSON to an object or return text based on the content type. If the content type is
     * not JSON or text the raw `Response` will be returned.
     *
     * You can transform the decoded body with `transformResponseBody`. This is useful if you need to do something
     * with the returned data. For example you could add it to a cache or create an instance of a class.
     *
     * ```js
     * // Via prepare
     * const preparedAction = action.prepare({ urlArgs: { id: '1' }});
     * preparedAction.execute();
     *
     * // Directly
     * action.execute({ urlArgs: { id: '1' }});
     * ```
     *
     * @param options.urlArgs args to pass through to `urlPattern.resolve`
     * @param options.query query params to pass through to `urlPattern.resolve`
     * @param options Options to pass to `fetch`. These will be merged with any options passed to `Endpoint` directly
     * and `Endpoint.defaultConfig.requestInit`. Options passed here will take precedence. Only the `headers` key will be merged if it
     * exists in multiple places (eg. defaultConfig may include headers you want on every request). If you need to remove
     * a header entirely set the value to `undefined`.
     */
    async execute(options: EndpointExecuteOptions = {}): Promise<ExecuteReturnVal<ReturnT>> {
        if (options.paginator) {
            options = options.paginator.getRequestInit(options);
        }
        const { urlArgs = {}, query, paginator, ...init } = options;
        const url = this.urlPattern.resolve(urlArgs, { query });
        try {
            const cls = Object.getPrototypeOf(this).constructor;
            const requestInit = mergeRequestInit(
                cls.defaultConfig.requestInit,
                this.requestInit,
                init
            );
            const returnVal: ExecuteReturnVal<ReturnT> = {
                url,
                urlArgs,
                query,
                requestInit,
                result: null,
            };
            returnVal.result = await fetch(url, requestInit)
                .then(async res => {
                    returnVal.response = res;
                    if (!res.ok) {
                        throw new ApiError(res.status, res.statusText, await this.decodeBody(res));
                    }
                    return res;
                })
                .then(res => this.decodeBody(res))
                .then(data => {
                    returnVal.decodedBody = data;
                    if (paginator) {
                        // If we have a paginator update its state based on response
                        // This runs for all requests but should return false if response
                        // is not paginated.
                        const paginationState = cls.defaultConfig.getPaginationState(
                            paginator,
                            returnVal
                        );
                        if (paginationState) {
                            paginator.setResponse(paginationState);
                            data = paginationState.results;
                        } else {
                            // TODO: If you specify a paginator and the response is not paginated should
                            // we warn? I think yes as I can't think of a reason why not but may need to
                            // revisit this if we find a usecase
                            console.warn(
                                'A paginator was defined but the response was not paginated. Paginator state has not been updated.'
                            );
                        }
                    }
                    return this.transformResponseBody ? this.transformResponseBody(data) : data;
                });
            return returnVal;
        } catch (err) {
            if (err instanceof ApiError) {
                throw err;
            }
            // Fetch itself threw an error. This can happen on network error.
            // All other errors (eg. 40X responses) are handled above on res.ok
            // check
            throw new RequestError(err.message);
        }
    }
}
