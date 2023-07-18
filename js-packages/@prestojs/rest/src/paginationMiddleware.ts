import {
    InferredPaginator,
    PaginationRequestDetails,
    PaginatorInterface,
    PaginatorInterfaceClass,
} from '@prestojs/util';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';

import set from 'lodash/set';
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

type GetPaginationState = (
    paginator: PaginatorInterface,
    requestDetails: PaginationRequestDetails
) => Record<string, any> | false;

/**
 * @expandproperties
 */
export type PaginationMiddlewareOptions = {
    /**
     * Function that returns the state for a paginator based on the response. If not provided
     * uses the static `getPaginationState` method on the `paginatorClass`. You can use this method if your backend needs
     * to transform the response before being handled by `paginatorClass`. This can be useful to use a built in paginator
     * (eg. PageNumberPaginator) where a data structure from the backend differs from that expected.
     */
    getPaginationState?: GetPaginationState;
    /**
     * Optional path to where in data the pagination state exists. Dotted notation is accepted (see below example).
     *
     * If this is provided only this section of the data object will be updated. For example if the return data looked like:
     *
     * ```json
     * {
     *   records: {
     *       users: {
     *           count: 10,
     *           results: [...]
     *       },
     *       products: [...]
     *   }
     *   extra: { ... }
     * }
     * ```
     *
     * And `resultPath` was set to `records.users` then the returned data would be
     *
     * ```json
     * {
     *   records: {
     *       // pagination state extracted, `results` set
     *       users: [...],
     *       // unchanged
     *       products: [...],
     *   }
     *   // unchanged
     *   extra: { ... }
     * }
     * ```
     *
     */
    resultPath?: string;
};
export class PaginationMiddleware<T> {
    paginatorClass: PaginatorInterfaceClass;
    getPaginationState?: GetPaginationState;
    resultPath?: string;

    constructor(
        paginatorClass: PaginatorInterfaceClass,
        { getPaginationState, resultPath }: PaginationMiddlewareOptions = {}
    ) {
        this.paginatorClass = paginatorClass;
        this.getPaginationState = getPaginationState;
        this.resultPath = resultPath;
    }
    init(endpoint: Endpoint): void {
        if (
            endpoint.getPaginatorClass &&
            // There's a default implementation that just throws an error - ignore that
            endpoint.getPaginatorClass !== Endpoint.prototype.getPaginatorClass
        ) {
            throw new Error(
                "Endpoint already has 'getPaginatorClass'. This could be because paginationMiddleware is included twice."
            );
        }
        const paginatorClass = this.paginatorClass;
        // Add getPaginatorClass to Endpoint so that it conforms to
        // PaginatorClassProvider and will work with usePaginator
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        endpoint.getPaginatorClass = (): typeof paginatorClass => paginatorClass;
    }

    prepare(options: EndpointExecuteOptions = {}): EndpointExecuteOptions {
        if (options.paginator) {
            return options.paginator.getRequestInit(options);
        }
        return options;
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
            if (
                !(paginator instanceof this.paginatorClass) &&
                this.paginatorClass !== InferredPaginator
            ) {
                throw new Error(
                    `paginationMiddleware specified '${
                        this.paginatorClass
                    }' as the expected paginator but received '${
                        (paginator as PaginatorInterface).constructor
                    }'`
                );
            }
            // If we have a paginator update its state based on response
            // This runs for all requests but should return false if response
            // is not paginated.
            const requestDetails = {
                query: urlConfig.query,
                decodedBody: this.resultPath ? get(decodedBody, this.resultPath) : decodedBody,
                url,
                urlArgs: urlConfig.args,
                response,
            };
            const paginationState = this.getPaginationState
                ? this.getPaginationState(paginator, requestDetails)
                : this.paginatorClass.getPaginationState(requestDetails);
            if (paginationState) {
                paginator.setResponse(paginationState);
                if (this.resultPath) {
                    const result = cloneDeep(decodedBody);
                    set(result, this.resultPath, paginationState.results);
                    return result;
                }
                return paginationState.results;
            } else {
                let msg = '';
                if (this.resultPath) {
                    if (!requestDetails.decodedBody) {
                        msg = `'resultPath' was specified as '${this.resultPath}' but that key does not exist in the data. Is it spelled correctly?.`;
                    } else {
                        msg = `'resultPath' was specified as '${this.resultPath}' and that key exists but does not appear to be paginated data.`;
                    }
                } else {
                    msg = "If the pagination data is nested specify the 'resultPath' option.";
                }
                console.warn(
                    `A paginator was defined but the response does not appear to be paginated.
${msg}

Attempted to process pagination state using ${this.paginatorClass.name} - if this is incorrect pass the correct class to 'paginationMiddleware'.

Paginator state has not been updated.

Data received:\n`,
                    decodedBody,
                    `\n\nRequest details:\n`,
                    requestDetails
                );
            }
        }
        return result;
    }
}

/**
 * Middleware to activate pagination on an endpoint.
 *
 * See [Endpoint pagination](doc:Endpoint#Pagination) for details on how pagination works.
 *
 * This should not be added globally. It should be added to each [Endpoint](doc:Endpoint)
 * that requires pagination.
 *
 * <Usage>
 * The default usage with no explicit paginator class passed will use [InferredPaginator](doc:InferredPaginator).
 *
 * ```js
 * new Endpoint(new UrlPattern('/users/'), {
 *   middleware: [paginationMiddleware()]
 * })
 * ```
 *
 * You can explicitly specify the paginator to use as follows:
 *
 * ```js
 * new Endpoint(new UrlPattern('/users/'), {
 *   middleware: [paginationMiddleware(PageNumberPaginator)]
 * })
 * ```
 * </Usage>
 *
 * @param paginatorClass The pagination class to use. Defaults to [InferredPaginator](doc:InferredPaginator).
 * @returns The middleware object to be passed to the [Endpoint](doc:Endpoint) `middleware` option.
 *
 * @extractdocs
 * @menugroup Middleware
 */
export default function paginationMiddleware<T>(
    paginatorClass: PaginatorInterfaceClass = InferredPaginator,
    options?: PaginationMiddlewareOptions
): MiddlewareObject<T> {
    return new PaginationMiddleware(paginatorClass, options);
}
