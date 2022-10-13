import qs from 'query-string';
import Paginator, { PaginationRequestDetails, PaginatorRequestOptions } from './Paginator';

export type LimitOffsetPaginationState = {
    limit?: number | string;
    offset?: number | string;
};

export type InternalLimitOffsetPaginationState = {
    total?: number | null;
};

/**
 * Limit & offset based paginator
 *
 * Expects a `limit` key in the response. See [getPaginationState](doc:getPaginationState) for how
 * to customise this if your backend implementation differs.
 *
 * @menu-group Pagination
 * @extract-docs
 */
export default class LimitOffsetPaginator extends Paginator<
    LimitOffsetPaginationState,
    InternalLimitOffsetPaginationState
> {
    /**
     * The total number of records available. This will be null before the first response is received.
     */
    get total(): number | null {
        return this.internalState.total ?? null;
    }

    /**
     * The current limit
     */
    get limit(): number | null {
        const limit = this.currentState.limit ?? null;
        if (typeof limit === 'string') {
            return Number(limit);
        }
        return limit;
    }

    /**
     * The current offset
     */
    get offset(): number {
        const offset = this.currentState.offset || 0;
        if (typeof offset === 'string') {
            return Number(offset);
        }
        return offset;
    }

    /**
     * Return the state for the specified limit
     *
     * Does not transition state. To transition state call `setLimit` instead.
     */
    limitState(limit: number | null): LimitOffsetPaginationState {
        if (limit != null && limit < 1) {
            throw new Error(`Invalid limit ${limit} - should be >= 1`);
        }
        // When page size changes we need to adjust the offset
        if (limit != null && this.limit !== limit && this.offset) {
            const offset = Math.floor(this.offset / limit) * limit;
            return { ...this.currentState, limit, offset };
        }
        const nextState: LimitOffsetPaginationState = {
            ...this.currentState,
            limit: limit ?? undefined,
        };
        if (limit == null) {
            delete nextState.offset;
            delete nextState.limit;
        }
        return nextState;
    }

    /**
     * Set the limit
     */
    setLimit(limit: number | null): void {
        this.setCurrentState(this.limitState(limit));
    }

    /**
     * Return the state for the specified offset
     *
     * Does not transition state. To transition state call `offsetState` instead.
     */
    offsetState(offset: number | null): LimitOffsetPaginationState {
        if (offset != null && offset < 0) {
            throw new Error(`Invalid offset ${offset} - should be >= 0`);
        }

        const nextState: LimitOffsetPaginationState = {
            ...this.currentState,
            offset: offset ?? undefined,
        };
        if (offset === 0 || offset == null) {
            delete nextState.offset;
        }
        return nextState;
    }

    setOffset(offset: number | null): void {
        return this.setCurrentState(this.offsetState(offset));
    }

    /**
     * Return the state for the next page
     *
     * Does not transition state. To transition state call `next` instead.
     */
    nextState(): LimitOffsetPaginationState | null {
        if (this.limit == null) {
            return null;
        }
        return this.offsetState(this.offset + this.limit);
    }

    /**
     * Go to the next page
     */
    next(): void {
        const nextState = this.nextState();
        if (nextState) {
            this.setCurrentState(nextState);
        }
    }

    /**
     * Return the state for the previous page
     *
     * Does not transition state. To transition state call `previous` instead.
     */
    previousState(): LimitOffsetPaginationState | null {
        if (this.limit == null) {
            return null;
        }
        return this.offsetState(Math.max(0, this.offset - this.limit));
    }

    /**
     * Go to the previous page.
     */
    previous(): void {
        if (this.limit == null) {
            throw new Error('Cannot go to next page until limit of current results is known');
        }
        this.setOffset(Math.max(0, this.offset - this.limit));
    }

    /**
     * Return the state for the first page
     *
     * Does not transition state. To transition state call `first` instead.
     */
    firstState(): LimitOffsetPaginationState {
        const nextState = { ...this.currentState };
        delete nextState.offset;
        return nextState;
    }

    /**
     * Go to the first page.
     */
    first(): void {
        this.setCurrentState(this.firstState());
    }

    /**
     * Return the state for the last page. If the last page isn't yet known (eg. results
     * haven't yet been returned) then null will be returned.
     *
     * Does not transition state. To transition state call `last` instead.
     */
    lastState(): LimitOffsetPaginationState | null {
        if (null == this.total || null == this.limit) {
            return null;
        }
        const offset = (Math.ceil(this.total / this.limit) - 1) * this.limit;
        return {
            ...this.currentState,
            offset,
        };
    }

    /**
     * Go to the last page.
     *
     * If the last page is not yet known because results haven't been returned this function
     * does nothing.
     */
    last(): void {
        const nextState = this.lastState();

        if (nextState) {
            this.setCurrentState(nextState);
        }
    }

    getRequestInit({ query, ...options }): PaginatorRequestOptions {
        const nextQuery = { ...query };
        if (this.limit) {
            nextQuery.limit = this.limit;
        }
        if (this.offset) {
            nextQuery.offset = this.offset;
        }
        return {
            query: nextQuery,
            ...options,
        };
    }

    /**
     * Sets the internal data based on response. Expects `limit` to be in response data.
     *
     * See [getPaginationState](doc:getPaginationState) for how to customise this if your backend implementation
     * differs.
     */
    setResponse({ limit, total }): void {
        this.setInternalState({ total });
        if (limit && this.currentState.limit !== limit) {
            this.setLimit(limit);
        }
    }

    /**
     * Returns true if there's more results after the current page
     */
    hasNextPage(): boolean {
        const nextState = this.nextState();
        if (nextState?.offset == null || this.internalState.total == null) {
            return false;
        }
        return nextState.offset < this.internalState.total;
    }

    /**
     * Returns true if there's a previous page
     */
    hasPreviousPage(): boolean {
        if (this.currentState.offset == null || this.internalState.total == null) {
            return false;
        }
        return this.currentState.offset > 0;
    }

    static getPaginationState(
        requestDetails: PaginationRequestDetails
    ): Record<string, any> | false {
        const { query, decodedBody } = requestDetails;
        // If it's an array then it's assumed to be unpaginated data
        if (Array.isArray(decodedBody) || !decodedBody) {
            return false;
        }

        // Limit/offset pagination responses should contain a next and previous link that includes
        // a query parameter with name 'limit' containing the next/previous limit value to use. It's
        // expected these would also include an 'offset' parameter but we ignore this as this is
        // calculated internally based on current pagination state. Results should be an array under
        // the `results` key.
        if (
            ('next' in decodedBody || 'previous' in decodedBody) &&
            // There should be a count or total as well - otherwise it's probably CursorPaginator
            ('count' in decodedBody || 'total' in decodedBody)
        ) {
            const parsedParams = qs.parse(
                qs.extract(decodedBody.previous || decodedBody.next || '')
            );
            // Only infer LimitOffsetPaginator if next/previous contain offset or limit query params. This is
            // to differentiate between PageNumberPaginator which has the same structure. Note that this means
            // if there is only 1 page then LimitOffsetPaginator will never be inferred... but if there's only
            // one page it likely doesn't matter (PageNumberPaginator will be inferred instead).
            if (!('offset' in parsedParams) && !('limit' in parsedParams)) {
                return false;
            }
            const { limit } = parsedParams;
            const r: Record<string, any> = {
                total: decodedBody.count ?? decodedBody.total,
                results: decodedBody.results,
                limit: null,
            };

            if (!limit) {
                const { offset } = query || {};
                // Infer limit if we are on first page and there's now next/previous link
                if (
                    r.total >= decodedBody.results.length &&
                    !offset &&
                    !decodedBody.previous &&
                    !decodedBody.next
                ) {
                    r.limit = decodedBody.results.length;
                }
            } else {
                r.limit = Number(limit);
            }

            return r;
        }

        // Not paginated - could be a single record result
        return false;
    }
}
