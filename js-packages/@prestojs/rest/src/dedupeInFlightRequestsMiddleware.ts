import { isDeepEqual } from '@prestojs/util';
import { EndpointRequestInit, MiddlewareFunction, MiddlewareUrlConfig } from './Endpoint';

function defaultGetKey(
    urlConfig: MiddlewareUrlConfig,
    requestInit: EndpointRequestInit
): MiddlewareUrlConfig & {
    method: string;
    headers: Record<string, string>;
    query: Record<string, string | string[] | null | undefined>;
} {
    return {
        ...urlConfig,
        method: requestInit.method,
        headers: [...requestInit.headers.entries()].reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {}),
    };
}

function defaultTest(urlConfig: MiddlewareUrlConfig, requestInit: EndpointRequestInit): boolean {
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
    test?: (urlConfig: MiddlewareUrlConfig, requestInit: EndpointRequestInit) => boolean;
    /**
     * Function to get a key for a request. If the key matches another in flight request then it
     * is considered a duplicate. The default implementation includes the URL, the request method and all request
     * headers in the key.
     *
     * The key can be anything (object, string, number) - it will be compared deeply to existing keys
     * for a match.
     */
    getKey?: (urlConfig: MiddlewareUrlConfig, requestInit: EndpointRequestInit) => any;
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
    const requestsInFlight = new Map<any, Promise<T>>();
    return async (
        urlConfig: MiddlewareUrlConfig,
        requestInit: EndpointRequestInit,
        next
    ): Promise<T> => {
        if (!test(urlConfig, requestInit)) {
            return next(urlConfig, requestInit);
        }
        const key = getKey(urlConfig, requestInit);
        let currentRequest: Promise<T> | null = null;
        for (const [k, value] of requestsInFlight.entries()) {
            if (isDeepEqual(k, key)) {
                currentRequest = value;
                break;
            }
        }
        if (currentRequest) {
            return currentRequest;
        }
        const promise = next(urlConfig, requestInit);
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
