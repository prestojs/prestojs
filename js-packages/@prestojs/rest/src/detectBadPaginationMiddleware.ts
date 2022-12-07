import { InferredPaginator } from '@prestojs/util';
import {
    EndpointRequestInit,
    MiddlewareContext,
    MiddlewareNextReturn,
    MiddlewareReturn,
    MiddlewareUrlConfig,
} from './Endpoint';
import { PaginationMiddleware } from './paginationMiddleware';

type IsPaginated<T> = (
    urlConfig: MiddlewareUrlConfig,
    requestInit: EndpointRequestInit,
    context: MiddlewareContext<T>
) => boolean;

export class DetectBadPaginationMiddleware<T> {
    isPaginated: IsPaginated<T>;
    constructor({ isPaginated }: { isPaginated: IsPaginated<T> }) {
        this.isPaginated = isPaginated;
    }
    async process(
        next: (
            urlConfig: MiddlewareUrlConfig,
            requestInit: RequestInit
        ) => Promise<MiddlewareNextReturn<T>>,
        urlConfig: MiddlewareUrlConfig,
        requestInit: EndpointRequestInit,
        context: MiddlewareContext<T>
    ): MiddlewareReturn<T> {
        let result;
        let isError = false;
        try {
            result = await next(urlConfig, requestInit);
        } catch (e) {
            isError = true;
            result = e;
        }
        const looksPaginated = this.isPaginated(urlConfig, requestInit, context);

        if (looksPaginated) {
            const paginationMiddleware = context.endpoint.middleware.find(
                middleware => middleware instanceof PaginationMiddleware
            );
            if (!paginationMiddleware) {
                console.error(
                    `The response for Endpoint(urlPattern=${context.endpoint.urlPattern.pattern}) looks paginated but 'paginationMiddleware' is not present. You likely need to add 'paginationMiddleware' to the middleware setting for this endpoint.`
                );
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore paginator not strictly part of types; is added when using paginationMiddleware
            } else if (!requestInit.paginator) {
                console.error(
                    `The response for Endpoint(urlPattern=${context.endpoint.urlPattern.pattern}) looks paginated and 'paginationMiddleware' is present but no 'paginator' has been supplied. You likely need to pass 'paginator' to endpoint.execute() eg. using 'usePaginator'.`
                );
            }
        }
        if (isError) {
            throw result;
        }
        return result;
    }
}

function defaultIsPaginated<T>(
    urlConfig: MiddlewareUrlConfig,
    requestInit: EndpointRequestInit,
    context: MiddlewareContext<T>
): boolean {
    const decodedBody = context.lastState?.decodedBody;
    if (typeof decodedBody === 'object' && decodedBody !== null) {
        const paginationRequestDetails = {
            query: urlConfig.query,
            decodedBody,
            url: context.lastState?.url as string,
            urlArgs: urlConfig.args,
            response: context.lastState?.response,
        };
        return !!InferredPaginator.getPaginationState(paginationRequestDetails);
    }
    return false;
}

/**
 * Middleware that detects if paginationMiddleware isn't present when it should be or if
 * `pagination` option to `Endpoint.execute` hasn't been supplied. If either of these cases
 * are detected an error will be logged to the console.
 *
 * This helps avoid cryptic errors when a response is paginated but other middleware expects
 * to receive just the results (e.g. [viewModelCachingMiddleware](doc:viewModelCachingMiddleware)).
 *
 * <Usage>
 * It is recommended you add this to the global list of middleware:
 *
 * ```js
 * Endpoint.defaultConfig.middleware = [
 *     ...Endpoint.defaultConfig.middleware,
 *      detectBadPaginationMiddleware(),
 * ];
 * ```
 * </Usage>
 *
 * @param isPaginated Function that returns `true` if a response is paginated. By default, this uses
 * `InferredPaginator.getPaginationState` to determine this. If you use custom pagination class(es) you
 * should provide this function.
 *
 * @extract-docs
 * @menu-group Middleware
 */
export default function detectBadPaginationMiddleware<T>(
    isPaginated: IsPaginated<T> = defaultIsPaginated
): DetectBadPaginationMiddleware<T> {
    return new DetectBadPaginationMiddleware<T>({ isPaginated });
}
