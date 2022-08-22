import { UrlPattern } from '@prestojs/routing';
import { PaginatorInterface } from '@prestojs/util';
import isEqual from 'lodash/isEqual';
import requestDefaultsMiddleware from './requestDefaultsMiddleware';

type ExecuteInitOptions = Omit<RequestInit, 'headers'> & {
    /**
     * Any headers to add to the request. You can unset default headers that might be specified in the default
     * `Endpoint.defaultConfig.requestInit` by setting the value to `undefined`.
     */
    headers?: HeadersInit | Record<string, undefined | string>;
    /**
     * The paginator instance to use. This can be provided in the constructor to use by default for all executions
     * of this endpoint or provided for each call to the endpoint.
     *
     * Only applicable if [paginationMiddleware](doc:paginationMiddleware) has been added to the Endpoint.
     */
    paginator?: PaginatorInterface | null;
};

/**
 * Same as [fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) but
 * guarantees `headers` is set and is a `Headers` instance, and `method` is set.
 */
export type EndpointRequestInit = { headers: Headers; method: string } & Omit<
    RequestInit,
    'headers' | 'method'
>;

interface Query {
    [key: string]: any;
}

/**
 * @expand-properties Any options accepted by [fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) in addition to those described below
 */
export type EndpointOptions<ReturnT> = ExecuteInitOptions & {
    /**
     * Method to decode body based on response. The default implementation looks at the content type of the
     * response and processes it accordingly (eg. handles JSON and text responses) and is suitable for most cases.
     * If you just need to transform the decoded body (eg. change the decoded JSON object) then use `middleware`
     * instead.
     */
    decodeBody?: (res: Response) => any;
    /**
     * A function to resolve the URL. It is passed the URL pattern object, any
     * arguments for the URL and any query string parameters.
     *
     * `this` is bound to the `Endpoint`.
     *
     * If not provided defaults to:
     *
     * ```js
     * function defaultResolveUrl(urlPattern, urlArgs, query, baseUrl) {
     *      if (baseUrl[baseUrl.length - 1] === '/') {
     *          baseUrl = baseUrl.slice(0, -1);
     *      }
     *      return baseUrl + this.urlPattern.resolve(urlArgs, { query });
     *  }
     * ```
     */
    resolveUrl?: (
        urlPattern: UrlPattern,
        urlArgs: Record<string, any>,
        query: Query | undefined,
        baseUrl: string
    ) => string;
    /**
     * Base URL to use. This is prepended to the return value of `urlPattern.resolve(...)` and can be used
     * to change the call to occur to a different domain.
     *
     * If not specified defaults to [Endpoint.defaultConfig.baseUrl](doc:Endpoint#static-var-defaultConfig)
     */
    baseUrl?: string;
    /**
     * Middleware to apply for this endpoint. By default `getMiddleware` concatenates this with the global
     * [Endpoint.defaultConfig.middleware](doc:Endpoint#static-var-defaultConfig)
     *
     * See [middleware](#Middleware) for more details
     */
    middleware?: Middleware<ReturnT>[];
    /**
     * Get the final middleware to apply for this endpoint. This combines the global middleware and the middleware
     * specific to this endpoint. Defaults to [Endpoint.defaultConfig.getMiddleware](doc:Endpoint#static-var-defaultConfig)
     * which applies the global middleware followed by the endpoint specific middleware.
     *
     * See [middleware](#Middleware) for more details
     */
    getMiddleware?: (
        middleware: Middleware<ReturnT>[],
        endpoint: Endpoint
    ) => MiddlewareFunction<ReturnT>[];
};

type UrlResolveOptions = {
    urlArgs?: Record<string, any>;
    query?: Query;
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
    urlArgs: Record<string, any>;
    /**
     * Any query string parameters
     */
    query: Query;
    /**
     * The options used to execute the endpoint with
     */
    requestInit: ExecuteInitOptions;
    /**
     * The response as returned by fetch
     */
    response: Response;
    /**
     * The value returned by `decodedBody`
     */
    decodedBody: any;
    /**
     * The value returned from the endpoint after it has passed through `decodeBody` and any middleware
     */
    result: T;
};

/**
 * @expand-properties Any options accepted by [fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) in addition to those described below
 */
export type EndpointExecuteOptions = ExecuteInitOptions & UrlResolveOptions;

/**
 * This can be passed to `next` in middleware to skip all subsequent middleware in the chain, the call
 * to `fetch` and resolve instead to the `promise` passed in.
 *
 * This is useful for middleware like [dedupeInFlightRequestsMiddleware](doc:dedupeInFlightRequestsMiddleware) where
 * if a duplicate request is detected it just needs to wait for the original request to finish and return the
 * same Response object.
 *
 * It can also be used to change how `fetch` is performed (`batchMiddleware` uses this).
 *
 * For example this just calls a completely different URL and uses the response object from that:
 *
 * ```js
 * function customFetchMiddleware(next, urlConfig, requestInit, context) {
 *   return next(new SkipToResponse(
 *       fetch('/somewhere-else/')
 *   ));
 * }
 * ```
 *
 * Note that this completely bypasses any subsequent middleware in the chain (including response handling) so any
 * security-related middleware should come before this.
 *
 * @extract-docs
 * @menu-group Endpoint
 */
export class SkipToResponse {
    promise: Promise<Response>;

    /**
     * @param promise The promise to resolve to instead of calling `fetch`.
     */
    constructor(promise: Promise<Response>) {
        this.promise = promise;
    }
}

// Symbol attached to a `Response` to store the decoded body. This is used to avoid decoding the response
// more than once (which is an error).
const DECODED_BODY = Symbol.for('@prestojs/Endpoint.DECODED_BODY');

/**
 * An instance of this is passed as the fourth parameter to middleware functions.
 * @extract-docs
 * @menu-group Endpoint
 */
export class MiddlewareContext<T> {
    /**
     * Function to re-execute the Endpoint. Accepts no arguments - it replays the request with identical arguments
     * as the first time. This will go through the full middleware cycle again. This is useful for middleware
     * that may replay a request after an initial failure, eg. if user isn't authenticated on initial attempt.
     */
    execute: () => Promise<T>;
    /**
     * The original options passed to [execute](doc:Endpoint#method-execute)
     */
    executeOptions: EndpointExecuteOptions;
    /**
     * The endpoint the middleware is executing within.
     */
    endpoint: Endpoint;
    /**
     * The options used to execute the endpoint with
     */
    requestInit: EndpointRequestInit;
    /**
     * The state as of when the last middleware in the chain was processed.
     *
     * This contains the `url`, `response`, `decodedBody` and `result`.
     */
    lastState: null | MiddlewareNextReturn<T>;

    /**
     * Should not be instantiated manually. This is created by `Endpoint` as part of processing a request.
     */
    constructor(options: {
        execute: () => Promise<T>;
        executeOptions: EndpointExecuteOptions;
        requestInit: EndpointRequestInit;
        endpoint: Endpoint;
        lastState: null | MiddlewareNextReturn<T>;
    }) {
        this.execute = options.execute;
        this.executeOptions = options.executeOptions;
        this.requestInit = options.requestInit;
        this.endpoint = options.endpoint;
        this.lastState = options.lastState;
    }

    private _fetchStartCallbacks: ((fetchPromise: Promise<Response>) => void)[] = [];

    /**
     * Mark a `Response` as decoded.
     *
     * You likely don't need this; use `decodeBody` on `Endpoint` instead. This is useful in cases
     * where you want to bypass the normal `Endpoint` `decodeBody` functionality (for example in
     * `batchMiddleware`).
     *
     * @param response The response object returned from `fetch`.
     * @param decodedBody The decoded body extracted from `response`.
     */
    markResponseDecoded(response: Response, decodedBody: Promise<T>): void {
        response[DECODED_BODY] = decodedBody;
    }

    /**
     * Listen for the start of the call to `fetch`. The callback will be called immediately
     * after `fetch` is called and is passed the `Promise` returned by `fetch`.
     *
     * This is useful for middleware like [dedupeInFlightRequestsMiddleware](doc:dedupeInFlightRequestsMiddleware)
     * that need access to the `fetch` `Promise` directly. It can then cache the promise and subsequently pass it to
     * [SkipToResponse](doc:SkipToResponse) to make other calls to an `Endpoint` use the same `fetch` `Response`.
     *
     * @param callback The callback that will be called when fetch starts. It will be passed the `Promise` returned by `fetch`
     */
    addFetchStartListener(callback: (fetchPromise: Promise<Response>) => void): () => void {
        this._fetchStartCallbacks.push(callback);
        return (): void => {
            const index = this._fetchStartCallbacks.indexOf(callback);
            if (index !== -1) {
                this._fetchStartCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Called internally by `Endpoint` to notify when `fetch` has started.
     *
     * Should not be called elsewhere.
     */
    notifyFetchStart(fetchPromise: Promise<Response>): void {
        this._fetchStartCallbacks.forEach(cb => cb(fetchPromise));
    }
}

export type MiddlewareNextReturn<ReturnT> = {
    /**
     * The resolved URL.
     *
     * Only available in the response part of the middleware.
     */
    url: string;
    /**
     * The response as returned by fetch.
     *
     * Only available in the response part of the middleware.
     */
    response: Response;
    /**
     * The value returned by `decodeBody`
     *
     * Only available in the response part of the middleware.
     */
    decodedBody: any;
    /**
     * The final value to return from middleware. This starts as `decodedBody` but can be modified
     * by middleware as it passes through them.
     */
    result: ReturnT;
};

export type MiddlewareReturn<ReturnT> = Promise<ReturnT | MiddlewareNextReturn<ReturnT>>;

export type MiddlewareUrlConfig = {
    pattern: UrlPattern;
    args: Record<string, any>;
    query: Query;
    baseUrl: string;
};

/**
 * @param next The next function in the middleware chain. Must be passed the `url` and `requestInit` objects. Alternatively
 * you can pass an instance of [SkipToResponse](doc:SkipToResponse) instead of `url` and `requestInit`.
 * @param urlConfig The URL config
 * @param requestInit See [fetch parameters](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
 * @param context The context for the current execute. This gives you access to the original options and a function to re-execute the command.
 * @returns Returns the value from `fetch` after it has been transformed by each middleware further down the chain
 */
export type MiddlewareFunction<T> = (
    next: MiddlewareNextFunction<T>,
    urlConfig: MiddlewareUrlConfig,
    requestInit: EndpointRequestInit,
    context: MiddlewareContext<T>
) => MiddlewareReturn<T>;

type MiddlewareNextFunction<T> = {
    (urlConfig: MiddlewareUrlConfig, requestInit: RequestInit): Promise<MiddlewareNextReturn<T>>;
    (skipToResponse: SkipToResponse): Promise<MiddlewareNextReturn<T>>;
};

/**
 * Object form of middleware. This allows more control over what the middleware can do. Specifically allows middleware
 * to define how it interacts with `Endpoint.prepare` and allows modifications to the `Endpoint` via `init`.
 *
 * @param prepare Function that is called in `Endpoint.prepare` to modify the options used. Specifically this allows middleware
 * to apply it's changes to the options used (eg. change URL etc) such that `Endpoint` correctly caches the call.
 * @param process Process the request through the middleware
 * @param init Called when the `Endpoint` is initialised and allows the middleware to modify the endpoint
 * class or otherwise do some kind of initialisation.
 *
 * @export-in-docs
 */
export interface MiddlewareObject<T> {
    prepare?: (options: EndpointExecuteOptions) => EndpointExecuteOptions;
    process?: MiddlewareFunction<T>;
    init?: (endpoint: Endpoint) => void;
}

export type Middleware<T> = MiddlewareFunction<T> | MiddlewareObject<T>;

/**
 * @expand-properties
 */
type DefaultConfig<ReturnT = any> = {
    /**
     * Default options used to execute the endpoint with
     */
    requestInit: RequestInit;
    /**
     * Default middleware to use on an endpoint. It is strongly recommended to append to this rather than replace it.
     *
     * Defaults to [requestDefaultsMiddleware](doc:requestDefaultsMiddleware).
     *
     * See [middleware](#Middleware) for more details
     */
    middleware: Middleware<ReturnT>[];
    /**
     * Get the final middleware to apply to the specified endpoint. By default applies the global middleware followed
     * by the endpoint specific middleware.
     */
    getMiddleware: (middleware: Middleware<ReturnT>[], endpoint: Endpoint) => Middleware<ReturnT>[];
    /**
     * Base to use for all urls. This can be used to change all URL's to be on a different origin.
     *
     * This can also be customised by middleware by changing `urlConfig.baseUrl` (defaults to this setting) or
     * in each `Endpoint` by passing `baseUrl` in options.
     */
    baseUrl: string;
};

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
 * Given multiple fetch [init](https://developer.mozilla.org/en-US/docs/Web/API/fetch#init) objects merge them into a
 * single object.
 *
 * This will only merge headers - body will not be merged. Earlier values are replaced by later values in the case of
 * duplicates.
 *
 * ## Usage
 *
 * ```js
 * mergeRequestInit(
 *     { headers: [['Accept', 'application/json']], body: 'first' },
 *     { headers: new Headers({ 'X-Custom': '1' }), body: 'second' },
 *     { credentials: 'include' }
 * )
 * // {
 * //    body: 'second',
 * //    headers: Headers({'accept': 'application/json', 'x-custom': '1'}),
 * //    credentials: 'include',
 * // }
 * ```
 *
 * @param args The objects to merge
 * @extract-docs
 * @menu-group Endpoint
 */
export function mergeRequestInit(
    ...args: (ExecuteInitOptions | EndpointRequestInit)[]
): RequestInit {
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

/**
 * @extract-docs
 */
type PreparedEndpoint<ReturnT> = {
    /**
     * Executes the endpoint. If `options` is provided they will override the options
     * used in the call to [Endpoint.prepare](doc:Endpoint#Method-prepare)
     */
    (options?: EndpointExecuteOptions): Promise<ExecuteReturnVal<ReturnT>>;

    /**
     * The endpoint this function was created from
     */
    endpoint: Endpoint<ReturnT>;
    /**
     * The '`options' passed to [Endpoint.prepare](doc:Endpoint#Method-prepare)
     */
    options: ExecuteInitOptions;
    /**
     * The `urlResolveOptions` passed to [Endpoint.prepare](doc:Endpoint#Method-prepare)
     */
    urlResolveOptions: UrlResolveOptions;

    /**
     * @deprecated Exists for backwards compatability only. Call the prepared endpoint function
     * directly instead.
     */
    execute(init?: ExecuteInitOptions): Promise<ExecuteReturnVal<ReturnT>>;
};

function prepareEndpoint<ReturnT>(
    endpoint: Endpoint<ReturnT>,
    urlResolveOptions: UrlResolveOptions,
    options: ExecuteInitOptions
): PreparedEndpoint<ReturnT> {
    function execute(_options: EndpointExecuteOptions = {}): Promise<ExecuteReturnVal<ReturnT>> {
        // TODO: This means that if this.options or init tries to remove
        // a default header by setting it to undefined it will not work
        // as the resulting object is a `Headers` instance that has had
        // the key removed from it already... but then in execute in Endpoint
        // we merge it with the defaultConfig
        return endpoint.execute({
            ...urlResolveOptions,
            ...mergeRequestInit(options, _options),
        });
    }
    execute.endpoint = endpoint;
    execute.urlResolveOptions = urlResolveOptions;
    execute.options = options;

    execute.execute = (_options: EndpointExecuteOptions = {}) => {
        console.warn(
            "'execute' on a prepared endpoint is deprecated - just call the returned function directly"
        );
        return execute(_options);
    };

    return execute;
}

/**
 * Indicates a response outside the 200 range. This is thrown by [Endpoint.execute](doc:Endpoint#Method-execute).
 *
 * @menu-group Endpoint
 * @extract-docs
 */
export class ApiError extends Error {
    /**
     * The [response status](https://developer.mozilla.org/en-US/docs/Web/API/Response/status)
     */
    status: number;
    /**
     * The [response status text](https://developer.mozilla.org/en-US/docs/Web/API/Response/statusText)
     */
    statusText: string;
    /**
     * The content of the response. This is the response after it has been passed through the `decodeBody` function
     * on the [Endpoint](doc:Endpoint)
     */
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
export function defaultDecodeBody(
    response: Response
): Response | Record<string, any> | string | null {
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

function defaultResolveUrl(
    urlPattern: UrlPattern,
    urlArgs: Record<string, any>,
    query: Query | undefined,
    baseUrl: string
): string {
    if (baseUrl[baseUrl.length - 1] === '/') {
        baseUrl = baseUrl.slice(0, -1);
    }
    return baseUrl + this.urlPattern.resolve(urlArgs, { query });
}

/**
 * Equality function used to compare keys used in `prepare`.
 *
 * We do deep equality on everything except the `paginator` key - for that we
 * do strict equality check as we want it to fail if they are different instances
 * even if they have the same internal state.
 */
function isEqualPrepareKey(a: ExecuteInitOptions, b: ExecuteInitOptions): boolean {
    if (a.paginator !== b.paginator) {
        return false;
    }
    return isEqual(a, b);
}

/**
 * Describe an REST API endpoint that can then be executed.
 *
 * * Accepts a [UrlPattern](doc:UrlPattern) to define the URL used. Any arguments & query parameters can be passed at execution time
 * * Accepts a `decodeBody` function that decodes the `Response` body as returned from [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). The
 *   default `decodeBody` will interpret the response based on the content type
 *   * If type includes 'json' (eg. application/json) returns decoded json
 *   * If type includes 'text (eg. text/plain, text/html) returns text
 *   * If status is 204 or 205 will return null
 * * [middleware](#Middleware) can be passed to transform the request before it is passed to `fetch` and/or the response after
 *   it has passed through `decodeBody`.
 * * All options accepted by `fetch` and these will be used as defaults to any call to `execute` or `prepare`.
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
 * const user = await userDetail.execute({ urlArgs: { id: 1 }, query: { 'showAddresses': true }});
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
 * // ...
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
 * Pagination for an endpoint is handled by [paginationMiddleware](doc:paginationMiddleware). This middleware
 * will add a `getPaginatorClass` method to the `Endpoint` which makes it compatible with [usePaginator](doc:usePaginator).
 * The default implementation chooses a paginator based on the shape of the response (eg. if the response looks like
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
 * See [usePaginator](doc:usePaginator) for more details about how to use a paginator in React.
 *
 * If your backend returns data in a different shape or uses headers instead of putting details in the response body
 * you can handle this by a) implementing your own paginator that extends one of the base classes and customising
 * the `getPaginationState` function or b) passing the `getPaginationState` method to [usePaginator](doc:usePaginator).
 * This function can return the data in the shape expected by the paginator.
 *
 * ## Middleware
 *
 * Middleware functions can be provided to alter the `url` or fetch options and transform the
 * response in some way.
 *
 * Middleware can be defined as either an object or as a function that is passed the url, the fetch options, the next
 * middleware function and a context object. The function can then make changes to the `url` or `requestInit` and pass
 * it through to the next middleware function. The call to `next` returns a `Promise` that resolves to the response of
 * the endpoint after it's been processed by any middleware further down the chain. You can return a modified response here.
 *
 * This middleware sets a custom header on a request but does nothing with the response:
 *
 * ```js
 * function clientHeaderMiddleware(next, urlConfig, requestInit, context) {
 *   requestInit.headers.set('X-ClientId', 'ABC123');
 *   // Return response unmodified
 *   return next(url.toUpperCase(), requestInit)
 * }
 * ```
 *
 * This middleware just transforms the response - converting it to uppercase.
 *
 * ```js
 * function upperCaseResponseMiddleware(next, urlConfig, requestInit, context) {
 *   const { result } = await next(url.toUpperCase(), requestInit)
 *   return result.toUpperCase();
 * }
 * ```
 *
 * Note that `next` will return an object containing `url`, `response`, `decodedBody` and `result`.
 * As a convenience you can return this object directly when you do not need to modify the result
 * in any way (the first example above). `result` contains the value returned from any middleware
 * that handled the response before this one or otherwise `decodedBody` for the first middleware.
 *
 * The [context object](doc:MiddlewareContext) can be used to retrieve the original options from the [Endpoint.execute](doc:Endpoint#method-execute)
 * call and re-execute the command. This is useful for middleware that may replay a request after an initial failure,
 * eg. if user isn't authenticated on initial attempt.
 *
 * ```js
 * // Access the original parameters passed to execute
 * context.executeOptions
 * // Re-execute the endpoint.
 * context.execute()
 * ```
 *
 * **NOTE:** Calling `context.execute()` will go through all the middleware again
 *
 * Middleware can be set globally for all [Endpoint](doc:Endpoint)'s on the [Endpoint.defaultConfig.middleware](doc:Endpoint#static-var-defaultConfig)
 * option or individually for each Endpoint by passing the `middleware` as an option when creating the endpoint.
 *
 * Set globally:
 *
 * ```js
 * Endpoint.defaultConfig.middleware = [
 *    dedupeInflightRequestsMiddleware,
 * ];
 * ```
 *
 * Or customise it per Endpoint:
 *
 * ```js
 * new Endpoint('/users/', { middleware: [csrfTokenMiddleware] })
 * ```
 *
 * When middleware is passed to the `Endpoint` it is _appended_ to the default
 * middleware specified in `Endpoint.defaultConfig.middleware`.
 *
 * To change how middleware is combined per `Endpoint` you can specify the
 * `getMiddleware` option. This is passed the middleware for the `Endpoint` and
 * the `Endpoint` itself and should return an array of middleware to use.
 *
 * The default implementation looks like
 *
 * ```js
 * (middleware) => [
 *   ...Endpoint.defaultConfig.middleware,
 *   ...middleware,
 * ]
 * ```
 *
 * You can change the default implementation on [Endpoint.defaultConfig.getMiddleware](doc:Endpoint#static-var-defaultConfig)
 *
 * Middleware can also be defined as an object with any of the following properties:
 *
 * * `init` - Called when the `Endpoint` is initialised and allows the middleware to modify the endpoint
 *   class or otherwise do some kind of initialisation.
 * * `prepare` - A function that is called in `Endpoint.prepare` to modify the options used. Specifically this allows middleware
 *   to apply its changes to the options used (eg. change URL etc) such that `Endpoint` correctly caches the call.
 * * `process` - Process the middleware. This behaves the same as the function form described above.
 *
 * ### Advanced
 *
 * For advanced use cases there's some additional hooks available.
 *
 * * [addFetchStartListener](doc:MiddlewareContext#method-addFetchStartListener) - This allows middleware to be notified
 *   when the call to `fetch` starts and get access to the `Promise`. [dedupeInFlightRequestsMiddleware](doc:dedupeInFlightRequestsMiddleware)
 *   uses this to cache an in flight request and return the same response for duplicate calls using [SkipToResponse](doc:SkipToResponse)
 * * [SkipToResponse](doc:SkipToResponse) - This allows middleware to skip the rest of the middleware chain and the call
 *   to `fetch`. Instead it is passed a promise that resolves to `Response` and this is used instead of doing the call
 *   to `fetch` for you.
 *
 * @menu-group Endpoint
 * @extract-docs
 */
export default class Endpoint<ReturnT = any> {
    /**
     * This defines the default settings to use on an endpoint globally.
     *
     * All these options can be customised on individual Endpoints.
     */
    // Init for this is after class definition
    static defaultConfig: DefaultConfig;

    /**
     * The [UrlPattern](doc:UrlPattern) this endpoint hits when executed.
     */
    urlPattern: UrlPattern;
    public requestInit: ExecuteInitOptions;
    private urlCache: Map<string, Map<{}, PreparedAction>>;
    public decodeBody: (res: Response) => any;
    public resolveUrl: (
        urlPattern: UrlPattern,
        urlArgs: Record<string, any>,
        query: Query | undefined,
        baseUrl: string
    ) => string;
    public middleware: Middleware<ReturnT>[];

    private _baseUrl?: string;

    /**
     * The base URL to use for this endpoint. This is prepended to the URL returned from `urlPattern.resolve`.
     *
     * If not specified then it defaults to [Endpoint.defaultConfig.baseUrl](doc:Endpoint#static-var-defaultConfig).
     *
     * Note that middleware can override this as well.
     */
    get baseUrl(): string {
        // This is a getter so that we can read `defaultConfig` when it's executing rather than when Endpoint
        // is instantiated (ie. you can change `baseUrl` after endpoints have been created.
        if (this._baseUrl == null) {
            return Endpoint.defaultConfig.baseUrl;
        }
        return this._baseUrl;
    }

    /**
     * @param urlPattern The [UrlPattern](doc:UrlPattern) to use to resolve the URL for this endpoint. If a plain `string`
     * is passed it will be converted to a [UrlPattern](doc:UrlPattern).
     * @param options The options to use for this endpoint.
     */
    constructor(urlPattern: UrlPattern | string, options: EndpointOptions<ReturnT> = {}) {
        const {
            decodeBody = defaultDecodeBody,
            resolveUrl = defaultResolveUrl,
            baseUrl,
            middleware = [],
            getMiddleware = Endpoint.defaultConfig.getMiddleware,
            ...requestInit
        } = options;

        this._baseUrl = baseUrl;
        this.urlPattern =
            urlPattern instanceof UrlPattern ? urlPattern : new UrlPattern(urlPattern);
        this.urlCache = new Map();
        this.decodeBody = decodeBody;
        this.requestInit = requestInit;
        this.resolveUrl = resolveUrl;
        this.middleware = getMiddleware(middleware, this);
        this.middleware.forEach(m => {
            if (typeof m !== 'function' && m.init) {
                m.init(this);
            }
        });
    }

    /**
     * Prepare an endpoint for execution. Given the same parameters returns the same function. This is
     * useful when you want a function to call that only changes when parameters to `prepare` change.
     * For example, you can use this with [useAsync](doc:useAsync) to call the endpoint whenever the
     * `urlArgs` change:
     *
     * ```js
     * // Cache getUser based on `id`. When `id` changes the endpoint will be re-executed
     * // by `useAsync`.
     * const getUser = getUserEndpoint.prepare({ urlArgs: { id } });
     * const { result } = useAsync(getUser, { trigger: 'SHALLOW' });
     * ```
     *
     * It can also be useful with third party libraries [SWR](https://swr.vercel.app/) where it
     * expects a key for caching purposes:
     *
     * ```js
     * const preparedEndpoint = endpoint.prepare();
     * const { data } = useSWR([preparedEndpoint], preparedEndpoint);
     * ```
     *
     * If you just want to call the endpoint directly then you can bypass `prepare` and just call `execute`
     * directly. e.g. these are equivalent:
     *
     * ```js
     * endpoint.prepare()()
     * // equivalent to
     * endpoint.execute()
     * ```
     *
     * @param options Any options to use when the endpoint is executed. Note that any options
     * used here can be overridden at call time.
     * @returns A function that can be called to execute the endpoint. Any of the arguments passed
     * to `prepare` will be used here but can be overridden with arguments to this function.
     */
    prepare(options: EndpointExecuteOptions = {}): PreparedEndpoint<ReturnT> {
        for (const middleware of this.middleware) {
            if (typeof middleware !== 'function' && middleware.prepare) {
                options = middleware.prepare(options);
            }
        }
        const { urlArgs = {}, query, ...init } = options;
        const url = this.resolveUrl(this.urlPattern, urlArgs, query, this.baseUrl);
        let cache = this.urlCache.get(url);
        if (!cache) {
            cache = new Map();
            this.urlCache.set(url, cache);
        }
        for (const [key, value] of cache.entries()) {
            if (isEqualPrepareKey(key, init)) {
                return value;
            }
        }
        const execute = prepareEndpoint(this, { urlArgs, query }, init);
        cache.set(init, execute);
        return execute;
    }

    /**
     * Triggers the `fetch` call for an action
     *
     * This can be called directly or indirectly via `prepare`.
     *
     * If the fetch call itself fails due to a network error then a `TypeError` will be thrown.
     *
     * If the fetch call is aborted due to a call to [AbortController.abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)
     * an `AbortError` is thrown.
     *
     * If the response is a non-2XX response an [ApiError](doc:ApiError) will be thrown.
     *
     * If the call is successful the body will be decoded using `decodeBody`. The default implementation
     * will decode JSON to an object or return text based on the content type. If the content type is
     * not JSON or text the raw `Response` will be returned.
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
        const { urlArgs = {}, query = {}, ...init } = options;
        // const url = this.resolveUrl(this.urlPattern, urlArgs, query);
        const urlConfig: MiddlewareUrlConfig = {
            pattern: this.urlPattern,
            args: urlArgs,
            query: query,
            baseUrl: this.baseUrl,
        };

        const cls = Object.getPrototypeOf(this).constructor;
        const requestInit = mergeRequestInit(
            cls.defaultConfig.requestInit,
            this.requestInit,
            init
        ) as EndpointRequestInit;

        const returnVal: Record<string, any> = {
            requestInit,
            result: null,
        };

        const executeWithMiddleware = async (): Promise<ReturnT> => {
            const middleware = [...this.middleware];
            let lastMiddleware;
            const middlewareContext = new MiddlewareContext<ReturnT>({
                execute: executeWithMiddleware,
                executeOptions: options,
                requestInit,
                endpoint: this,
                lastState: null,
            });
            let lastMiddlewareReturn: MiddlewareNextReturn<ReturnT>;
            const next = async (
                urlConfigOrSkipToResponse: MiddlewareUrlConfig | SkipToResponse,
                requestInit?: EndpointRequestInit
            ): Promise<MiddlewareNextReturn<ReturnT>> => {
                const skipToResponse =
                    urlConfigOrSkipToResponse instanceof SkipToResponse
                        ? urlConfigOrSkipToResponse
                        : false;
                if (!skipToResponse) {
                    let errors: string[] = [];
                    if (typeof urlConfig !== 'object') {
                        errors.push(
                            `'urlConfig' arg from middleware was not an object, received: ${urlConfig}`
                        );
                    }
                    if (!requestInit || typeof requestInit != 'object') {
                        errors.push(
                            `'requestInit' arg from middleware was not an object, received: ${requestInit}`
                        );
                    }
                    if (errors.length > 0) {
                        const err = errors.join('\n');
                        throw new Error(
                            `Bad middleware implementation; invalid arguments\n\n${err}\n\nOccurred in middleware:\n\n${lastMiddleware}`
                        );
                    }
                }
                const nextMiddleware = middleware.shift();
                if (!nextMiddleware || skipToResponse) {
                    const url = this.resolveUrl(
                        urlConfig.pattern,
                        urlConfig.args,
                        urlConfig.query,
                        urlConfig.baseUrl
                    );
                    returnVal.url = url;
                    returnVal.urlArgs = urlConfig.args;
                    returnVal.query = urlConfig.query;
                    const fetchPromise = skipToResponse
                        ? skipToResponse.promise
                        : this.fetch(url, requestInit);
                    middlewareContext.notifyFetchStart(fetchPromise);
                    const response = await fetchPromise;
                    // Make sure body is only decoded once. With `SkipToResponse` we can be dealing
                    // with the same `Response` multiple times (eg. from dedupeInFlightRequestsMiddleware).
                    if (!(DECODED_BODY in response)) {
                        middlewareContext.markResponseDecoded(response, this.decodeBody(response));
                    }
                    const decodedBody = await response[DECODED_BODY];
                    if (!response.ok) {
                        throw new ApiError(response.status, response.statusText, decodedBody);
                    }
                    returnVal.response = response;
                    returnVal.decodedBody = decodedBody;

                    lastMiddlewareReturn = {
                        result: decodedBody,
                        url,
                        response: returnVal.response,
                        decodedBody: returnVal.decodedBody,
                    };
                    middlewareContext.lastState = lastMiddlewareReturn;
                    return lastMiddlewareReturn;
                }
                lastMiddleware = nextMiddleware;
                const process =
                    typeof nextMiddleware === 'function'
                        ? nextMiddleware
                        : nextMiddleware.process?.bind(nextMiddleware);
                let result: MiddlewareNextReturn<ReturnT> | ReturnT;
                if (!process) {
                    // For MiddlewareObject `process` is optional - if not set just proceed to next middleware in chain
                    result = await next(urlConfig, requestInit);
                } else {
                    result = await process(next, urlConfig, requestInit, middlewareContext);
                    if (result === undefined) {
                        throw new Error(
                            `Bad middleware implementation; function did not return anything\n\nOccurred in middleware:\n\n${lastMiddleware}`
                        );
                    }
                }
                if (result === lastMiddlewareReturn) {
                    return result;
                }
                lastMiddlewareReturn = {
                    result: result as ReturnT,
                    url: returnVal.url,
                    response: returnVal.response,
                    decodedBody: returnVal.decodedBody,
                };
                middlewareContext.lastState = lastMiddlewareReturn;
                return lastMiddlewareReturn;
            };
            // mergeRequestInit here is just used to clone requestInit
            return (await next(urlConfig, mergeRequestInit(requestInit) as EndpointRequestInit))
                .result;
        };
        returnVal.result = await executeWithMiddleware();
        return returnVal as ExecuteReturnVal<ReturnT>;
    }

    /**
     * Calls [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
     *
     * You can extend `Endpoint` and override this if you need to customise something that isn't
     * possible with middleware.
     */
    public async fetch(url: string, requestInit: RequestInit | undefined): Promise<Response> {
        return fetch(url, requestInit);
    }
}

// Initialisation is not done inline in class as doc extractor doesn't handle object literals well
Endpoint.defaultConfig = {
    baseUrl: '',
    requestInit: {},
    middleware: [requestDefaultsMiddleware],
    getMiddleware: <T>(middleware: Middleware<T>[]): Middleware<T>[] => [
        ...Endpoint.defaultConfig.middleware,
        ...middleware,
    ],
};
