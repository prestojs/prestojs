import { EndpointRequestInit, MiddlewareReturn, MiddlewareUrlConfig } from './Endpoint';

/**
 * Middleware to set defaults on `requestInit`.
 *
 * This is a convenience for other middleware so they can assume certain properties
 * are always set.
 *
 * * If `method` is not set it will set it to `GET`
 * * If `headers` is not set will set it to `new Headers()`
 *
 * This is included by default in [Endpoint.defaultConfig.getMiddleware](doc:Endpoint#static-var-defaultConfig).
 *
 * @extract-docs
 * @menu-group Middleware
 */
export default function requestDefaultsMiddleware<T>(
    urlConfig: MiddlewareUrlConfig,
    requestInit: EndpointRequestInit,
    next: (urlConfig: MiddlewareUrlConfig, requestInit: RequestInit) => Promise<T>
): MiddlewareReturn<T> {
    // Always make sure headers & method is set so middleware implementations can assume it exists
    if (!requestInit.headers) {
        requestInit.headers = new Headers();
    }
    if (!requestInit.method) {
        requestInit.method = 'GET';
    }
    return next(urlConfig, requestInit);
}
