import {
    getPaginationState as defaultGetPaginationState,
    InferredPaginator,
    PaginationRequestDetails,
    PaginatorInterface,
    PaginatorInterfaceClass,
} from '@prestojs/util';
import Endpoint, {
    EndpointExecuteOptions,
    EndpointRequestInit,
    mergeRequestInit,
    MiddlewareContext,
    MiddlewareNextReturn,
    MiddlewareObject,
    MiddlewareReturn,
    MiddlewareUrlConfig,
} from './Endpoint';

/**
 * Middleware to activate pagination on an endpoint.
 *
 * This should not be added globally. It should be added to each Endpoint
 * that requires pagination.
 *
 * Usage:
 *
 * ```js
 * new Endpoint(new UrlPattern('/users/'), {
 *   middleware: [paginationMiddleware()]
 * })
 * ```
 *
 * Or to customise the paginatorClass
 *
 * ```js
 * new Endpoint(new UrlPattern('/users/'), {
 *   middleware: [paginationMiddleware(PageNumberPaginator)]
 * })
 * ```
 *
 * @param paginatorClass The pagination class to use. Defaults to [InferredPaginator](doc:InferredPaginator).
 * @param getPaginationState Function that returns the state for a paginator based on the response.
 * See [getPaginationState](doc:getPaginationState] for the default implementation
 *
 * @extract-docs
 * @menu-group Middleware
 */
export default function paginationMiddleware<T>(
    paginatorClass: PaginatorInterfaceClass = InferredPaginator,
    getPaginationState: (
        paginator: PaginatorInterface,
        requestDetails: PaginationRequestDetails
    ) => Record<string, any> | false = defaultGetPaginationState
): MiddlewareObject<T> {
    return {
        init(endpoint: Endpoint): void {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            if (endpoint.getPaginatorClass) {
                throw new Error(
                    "Endpoint already has 'getPaginatorClass'. This could be because paginationMiddleware is included twice."
                );
            }
            // Add getPaginatorClass to Endpoint so that it conforms to
            // PaginatorClassProvider and will work with usePaginator
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            endpoint.getPaginatorClass = (): typeof paginatorClass => paginatorClass;
        },

        prepare(options: EndpointExecuteOptions = {}): EndpointExecuteOptions {
            if (options.paginator) {
                return options.paginator.getRequestInit(options);
            }
            return options;
        },

        async process(
            next: (
                urlConfig: MiddlewareUrlConfig,
                requestInit: RequestInit
            ) => Promise<MiddlewareNextReturn<T>>,
            urlConfig: MiddlewareUrlConfig,
            requestInit: EndpointRequestInit,
            context: MiddlewareContext<T>
        ): MiddlewareReturn<T> {
            const {
                executeOptions: { paginator },
            } = context;
            if (paginator) {
                const { headers, ...urlConfigChanges } = paginator.getRequestInit({
                    headers: requestInit.headers,
                    urlArgs: urlConfig.args,
                    query: urlConfig.query,
                });
                Object.assign(urlConfig, urlConfigChanges);
                requestInit = mergeRequestInit(requestInit, { headers }) as EndpointRequestInit;
            }
            const { url, response, decodedBody, result } = await next(urlConfig, requestInit);
            if (paginator) {
                if (result !== decodedBody) {
                    // This middleware needs to handle the response first and transform it from the paginated
                    // shape to just the shape of the results. eg.
                    // { count: 10, results: [...records...] }
                    // just returns
                    // [...records...]
                    // And the `count` goes into the paginator internal state
                    throw new Error('paginatorMiddleware must be the first to handle the response');
                }
                // If we have a paginator update its state based on response
                // This runs for all requests but should return false if response
                // is not paginated.
                const paginationState = getPaginationState(paginator, {
                    query: urlConfig.query,
                    decodedBody,
                    url,
                    urlArgs: urlConfig.args,
                    response,
                });
                if (paginationState) {
                    paginator.setResponse(paginationState);
                    return paginationState.results;
                } else {
                    // TODO: If you specify a paginator and the response is not paginated should
                    // we warn? I think yes as I can't think of a reason why not but may need to
                    // revisit this if we find a usecase
                    console.warn(
                        'A paginator was defined but the response was not paginated. Paginator state has not been updated.'
                    );
                }
            }
            return result;
        },
    };
}
