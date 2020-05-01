import qs from 'qs';
import { ExecuteReturnVal } from './Endpoint';
import InferredPaginator from './InferredPaginator';
import Paginator from './Paginator';

/**
 * Return the state for a paginator based on the response itself.
 *
 * The default implementation is for use in conjunction with InferredPaginator where the pagination type
 * isn't known upfront but is inferred from the shape of the response.
 */
export default function getPaginationState<State, InternalState, Data>(
    paginator: Paginator<State, InternalState> | InferredPaginator,
    { query, decodedBody }: ExecuteReturnVal<Data>
): Record<string, any> | false {
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
