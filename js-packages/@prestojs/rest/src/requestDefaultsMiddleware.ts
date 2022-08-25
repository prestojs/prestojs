import { EndpointRequestInit, MiddlewareReturn, MiddlewareUrlConfig } from './Endpoint';

/**
 * Middleware to set defaults on `requestInit`.
 *
 * This is a convenience for other middleware so that they can assume certain properties
 * are always set.
 *
 * * If `method` is not set it will set it to `GET`
 * * If `headers` is not set will set it to `new Headers()`
 *
 * This is included by default in [Endpoint.defaultConfig.getMiddleware](doc:Endpoint#Property-defaultConfig).
 *
 * <Usage>
 * This middleware is included by default. If you have customised `defaultConfig` it's recommended you keep this
 * middleware:
 *
 * ```
 * Endpoint.defaultConfig.middleware = [
 *    requestDefaultsMiddleware,
 *    customMiddleware1,
 *    customMiddleware2,
 * ]
 * ```
 *
 * Or if you are providing a custom `getMiddleware` that doesn't refer to `defaultConfig.middleware`:
 *
 * ```js
 * Endpoint.defaultConfig.getMiddleware = (middleware) => [
 *      requestDefaultsMiddleware,
 *      customGlobalDefaultMiddleware,
 *     ...middleware,
 * ],
 * ```
 * </Usage>
 *
 * @extract-docs
 * @menu-group Middleware
 * @hide-api
 */
export default function requestDefaultsMiddleware<T>(
    next: (urlConfig: MiddlewareUrlConfig, requestInit: RequestInit) => Promise<T>,
    urlConfig: MiddlewareUrlConfig,
    requestInit: EndpointRequestInit
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
