import { EndpointRequestInit, MiddlewareFunction } from './Endpoint';

function defaultGetKey(url: string, requestInit: EndpointRequestInit): string {
    return [
        url,
        requestInit.method,
        [...requestInit.headers.entries()].map(([key, value]) => `${key}⁞${value}`).join('__'),
    ].join('|');
}

function defaultTest(url: string, requestInit: EndpointRequestInit): boolean {
    return requestInit.method.toUpperCase() === 'GET';
}

/**
 * @expand-properties
 */
type DedupeOptions = {
    /**
     * Function to test whether a request is subject to de-duping. The default implementation only
     * de-dupes requests with `method` set to `GET`.
     */
    test?: (url: string, requestInit: EndpointRequestInit) => boolean;
    /**
     * Function to get a key for a request. If the key matches another in flight request then it
     * is considered a duplicate. The default implementation includes the URL, the request method and all request
     * headers in the key.
     */
    getKey?: (url: string, requestInit: EndpointRequestInit) => string;
};

/**
 * Middleware that will dedupe simultaneous identical in flight requests. All requests that are matched
 * as duplicates will all resolve to the same value with only a single `fetch` call having occured.
 *
 * To use this globally set the following somewhere that executes when your app starts:
 *
 * ```js
 * Endpoint.defaultConfig.middleware = [
 *   dedupeInFlightRequestsMiddleware(),
 * ];
 * ```
 *
 * @returns Middleware function to pass to [Endpoint](doc:Endpoint) or set on [Endpoint.defaultConfig.middleware](http://localhost:3000/docs/rest/Endpoint#static-var-defaultConfig)
 * @extract-docs
 * @menu-group Middleware
 */
export default function dedupeInFlightRequestsMiddleware<T>(
    options: DedupeOptions = {}
): MiddlewareFunction<T> {
    const { test = defaultTest, getKey = defaultGetKey } = options;
    const requestsInFlight = new Map<string, Promise<T>>();
    return async (url: string, requestInit: EndpointRequestInit, next): Promise<T> => {
        if (!test(url, requestInit)) {
            return next(url, requestInit);
        }
        const key = getKey(url, requestInit);
        const currentRequest = requestsInFlight.get(key);
        if (currentRequest) {
            return currentRequest;
        }
        const promise = next(url, requestInit);
        requestsInFlight.set(key, promise);
        try {
            const r = await promise;
            requestsInFlight.delete(key);
            return r;
        } catch (err) {
            requestsInFlight.delete(key);
            throw err;
        }
    };
}
