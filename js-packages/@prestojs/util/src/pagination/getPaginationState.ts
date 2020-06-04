import qs from 'qs';
import InferredPaginator from './InferredPaginator';
import Paginator from './Paginator';

/**
 * @expand-properties eg. the return value from [Endpoint.execute](doc:Endpoint#method-execute)
 */
type PaginationRequestDetails<T> = {
    /**
     * Any query string parameters
     */
    query?: Record<string, boolean | string | null | number>;
    /**
     * The value returned by `decodedBody`. See [Endpoint.execute](doc:Endpoint#method-execute).
     */
    decodedBody?: any;
};

/**
 * Return the state for a paginator based on the response itself.
 *
 * This is the default implementation used by [Endpoint](doc:Endpoint) to provide pagination state expected by
 * [InferredPaginator](doc:InferredPaginator).
 *
 * To provide your own:
 *
 * ```js
 *import { Endpoint } from '@prestojs/rest';
 *
 * function getPaginationState(paginator, { query, decodedBody }) {
 *    ....
 * }
 *
 * Endpoint.defaultConfig.getPaginationState = getPaginationState;
 * ```
 *
 * @param paginator The paginator instance
 *
 * @menu-group Pagination
 * @extract-docs
 */
export default function getPaginationState<State, InternalState, Data>(
    paginator: Paginator<State, InternalState> | InferredPaginator,
    requestDetails: PaginationRequestDetails<Data>
): Record<string, any> | false {
    const { query, decodedBody } = requestDetails;
    // If it's an array then it's assumed to be unpaginated data
    if (Array.isArray(decodedBody) || !decodedBody) {
        return false;
    }

    // Cursor pagination responses should contain a next and previous link that includes
    // a query parameter with name 'cursor' containing the next/previous cursor value. Results
    // should be an array under the `results` key.
    const isCursorLink = (link: any): boolean =>
        typeof link == 'string' && link.includes('cursor=');
    if (isCursorLink(decodedBody.next) || isCursorLink(decodedBody.previous)) {
        const state: Record<string, any> = {
            results: decodedBody.results,
            nextCursor: decodedBody.next
                ? qs.parse(decodedBody.next.split('?').pop()).cursor
                : null,
            previousCursor: decodedBody.previous
                ? qs.parse(decodedBody.previous.split('?').pop()).cursor
                : null,
        };
        if (decodedBody.pageSize) {
            state.pageSize = decodedBody.pageSize;
        }
        return state;
    }

    // Limit/offset pagination responses should contain a next and previous link that includes
    // a query parameter with name 'limit' containing the next/previous limit value to use. It's
    // expected these would also include an 'offset' parameter but we ignore this as this is
    // calculated internally based on current pagination state. Results should be an array under
    // the `results` key.
    const isLimitOffsetLink = (link: any): boolean =>
        typeof link == 'string' && link.includes('limit=');
    if (isLimitOffsetLink(decodedBody.next) || isLimitOffsetLink(decodedBody.previous)) {
        const { limit } = qs.parse((decodedBody.previous || decodedBody.next).split('?').pop());
        return {
            total: decodedBody.count,
            results: decodedBody.results,
            limit: Number(limit),
        };
    }

    // Page number pagination expects a response containing the total number of records (`count`) and
    // an array of results under the `results` key. pageSize is inferred from response where possible.
    if (Array.isArray(decodedBody.results) && typeof decodedBody.count == 'number') {
        let { pageSize } = decodedBody;
        if (!pageSize) {
            const { page } = query || {};
            // Infer page size if we are on first page and total results are greater
            // than returned results
            if (decodedBody.count > decodedBody.results.length && (page === 1 || page == null)) {
                pageSize = decodedBody.results.length;
            }
        }
        return {
            total: decodedBody.count,
            results: decodedBody.results,
            pageSize,
        };
    }

    // Not paginated - could be a single record result
    return false;
}
