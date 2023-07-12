import qs from 'query-string';
import Paginator, { PaginationRequestDetails, PaginatorRequestOptions } from './Paginator';

export type CursorPaginationState = {
    pageSize?: number;
    cursor?: string;
};

export type InternalCursorPaginatorState = {
    nextCursor?: string | null;
    previousCursor?: string | null;
};

/**
 * Cursor based paginator
 *
 * See [Paginator](doc:Paginator) for an overview of how state is managed for paginator classes.
 *
 * <Alert type="info">
 *     There are two supported response shapes by default. The first assumes `next` and `previous` are URLs
 *     with a 'cursor' query parameter. If this shape is encountered the 'cursor' query parameter will be extracted:
 *
 *     ```json
 *     {
 *          next: null|'http://example.com/?cursor=abc123',
 *          previous: null|'http://example.com/?cursor=abc123',
 *          results: Array,
 *          pageSize: 20,
 *      }
 *      ```
 *
 *     The other assumes `nextCursor` and `previousCursor` are the cursor values directly.
 *
 *     ```json
 *     { pageSize: 20, next: 'abc123', previous: 'abc456', results: Array }
 *     ```
 *
 *     `pageSize` in both is optional.
 *
 *     If there's no next or previous page those values should be `null`.
 * </Alert>
 *
 * <Usage>
 *     The basic usage outside of React is:
 *
 *     ```js
 *     let state = {};
 *     const setState = nextState => {
 *         state = nextState;
 *     };
 *     let internalState = {};
 *     const setInternalState = nextState => {
 *         internalState = nextState;
 *     };
 *     const paginator = new CursorPaginator([state, setState], [internalState, setInternalState]);
 *     paginator.setResponse({ pageSize: 20, nextCursor: 'abc123', previousCursor: 'abc456' });
 *     // state == { pageSize: 20 }
 *     // internalState == { next: 'abc123', previous: 'abc456' }
 *     paginator.next();
 *     // state == { pageSize: 20, cursor: 'abc123' }
 *     ```
 *
 *     To use in a component use the [usePaginator](doc:usePaginator) hook with [paginationMiddleware](doc:paginationMiddleware)
 *     instead. See the [Use with usePaginator & paginationMiddleware](#example-02-use-paginator) example.
 * </Usage>
 *
 * @menugroup Pagination
 * @extractdocs
 */
export default class CursorPaginator extends Paginator<
    CursorPaginationState,
    InternalCursorPaginatorState
> {
    /**
     * The next cursor (if any)
     */
    get nextCursor(): string | null {
        return this.internalState.nextCursor ?? null;
    }

    /**
     * THe previous cursor (if any)
     */
    get previousCursor(): string | null {
        return this.internalState.previousCursor ?? null;
    }

    /**
     * The current cursor. This will be null before the first response is received.
     */
    get cursor(): string | null {
        return this.currentState.cursor ?? null;
    }

    /**
     * The current page size, if known
     */
    get pageSize(): number | null {
        return this.currentState.pageSize ?? null;
    }

    /**
     * Return the state for the specified page size
     *
     * Does not transition state. To transition state call `setPageSize` instead.
     */
    pageSizeState(pageSize: number | null): CursorPaginationState {
        if (pageSize != null && pageSize < 1) {
            throw new Error(`Invalid pageSize ${pageSize} - should be >= 1`);
        }

        // If page size changes any next/previous cursors are no invalid
        if (this.currentState.pageSize !== pageSize) {
            this.setInternalState({ nextCursor: null, previousCursor: null });
        }
        const nextState: CursorPaginationState = {
            ...this.currentState,
            pageSize: pageSize ?? undefined,
        };
        if (pageSize == null) {
            delete nextState.pageSize;
        }
        return nextState as CursorPaginationState;
    }

    /**
     * Set the page size
     */
    setPageSize(pageSize: null | number): void {
        this.setCurrentState(this.pageSizeState(pageSize));
    }

    /**
     * Return the state for the first page
     *
     * Does not transition state. To transition state call `first` instead.
     */
    firstState(): CursorPaginationState {
        // first page is equivalent to not specifying cursor
        const nextState: CursorPaginationState = { ...this.currentState };
        delete nextState.cursor;
        return nextState;
    }

    /**
     * Go to the first page.
     */
    first(): void {
        this.setCurrentState(this.firstState());
    }

    /**
     * Return the state for the first page. If the next page isn't yet known (eg. results
     * haven't yet been returned) then null will be returned.
     *
     * Does not transition state. To transition state call `next` instead.
     */
    nextState(): CursorPaginationState | null {
        if (this.nextCursor == null) {
            return null;
        }
        return { ...this.currentState, cursor: this.nextCursor };
    }

    /**
     * Go to the next page.
     *
     * If the last next is not yet known because results haven't been returned this function
     * does nothing.
     */
    next(): void {
        const nextState = this.nextState();
        if (nextState) {
            this.setCurrentState(nextState);
        }
    }

    /**
     * Return the state for the previous page. If the previous page isn't yet known (eg. results
     * haven't yet been returned) then null will be returned.
     *
     * Does not transition state. To transition state call `previous` instead.
     */
    previousState(): CursorPaginationState | null {
        if (this.previousCursor == null) {
            return null;
        }
        return { ...this.currentState, cursor: this.previousCursor };
    }

    /**
     * Go to the previous page.
     *
     * If the previous page is not yet known because results haven't been returned this function
     * does nothing.
     */
    previous(): void {
        const nextState = this.previousState();
        if (nextState) {
            this.setCurrentState(nextState);
        }
    }

    getRequestInit({ query, ...options }: PaginatorRequestOptions): PaginatorRequestOptions {
        const newQuery = { ...query };
        if (this.currentState.pageSize) {
            newQuery.pageSize = this.currentState.pageSize;
        }
        if (this.currentState.cursor) {
            newQuery.cursor = this.currentState.cursor;
        }
        return {
            query: newQuery,
            ...options,
        };
    }

    /**
     * Sets the internal data based on response. Expects `nextCursor`, `previousCursor` and optionally `pageSize` to be in
     * response data.
     *
     * See [getPaginationState](doc:getPaginationState) for how to customise this if your backend implementation
     * differs.
     */
    setResponse({
        nextCursor,
        previousCursor,
        pageSize,
    }: {
        nextCursor?: string | null;
        previousCursor?: string | null;
        pageSize?: number;
    }): void {
        this.setInternalState({
            nextCursor: nextCursor == null ? null : nextCursor,
            previousCursor: previousCursor == null ? null : previousCursor,
        });
        if (pageSize && this.currentState.pageSize !== pageSize) {
            this.setCurrentState({ ...this.currentState, pageSize });
        }
    }

    /**
     * Returns true if there's more results after the current page
     */
    hasNextPage(): boolean {
        return !!this.internalState.nextCursor;
    }

    /**
     * Returns true if there's more results after the current page
     */
    hasPreviousPage(): boolean {
        return !!this.internalState.previousCursor;
    }

    /**
     * See [Paginator.getPaginationState](doc:Paginator#Method-getPaginationState) for details about how this
     * method is used.
     *
     * Supports the following response shapes:
     *
     * ```json
     * {
     *     next: null|'http://example.com/?cursor=abc123',
     *     previous: null|'http://example.com/?cursor=abc123',
     *     results: Array
     * }
     * ```
     *
     * or
     *
     * ```json
     * {
     *     nextCursor: 'abc123',
     *     previousCursor: 'abc123',
     *     results: Array
     * }
     * ```
     *
     * @param requestDetails
     */
    static getPaginationState(
        requestDetails: PaginationRequestDetails
    ): Record<string, any> | false {
        const { decodedBody } = requestDetails;
        // If it's an array then it's assumed to be unpaginated data
        if (Array.isArray(decodedBody) || !decodedBody) {
            return false;
        }

        // If there's a count then it can't be a cursor pagination - probably it's LimitOffset instead
        if ('count' in decodedBody || 'total' in decodedBody) {
            return false;
        }

        // Cursor pagination responses should contain a next and previous link that includes
        // a query parameter with name 'cursor' containing the next/previous cursor value. Results
        // should be an array under the `results` key.
        if ('next' in decodedBody || 'previous' in decodedBody) {
            const state: Record<string, any> = {
                results: decodedBody.results,
                nextCursor: decodedBody.next ? qs.parse(qs.extract(decodedBody.next)).cursor : null,
                previousCursor: decodedBody.previous
                    ? qs.parse(qs.extract(decodedBody.previous)).cursor
                    : null,
            };
            if (decodedBody.pageSize) {
                state.pageSize = decodedBody.pageSize;
            }
            return state;
        }

        if ('nextCursor' in decodedBody || 'previousCursor' in decodedBody) {
            const state: Record<string, any> = {
                results: decodedBody.results,
                nextCursor: decodedBody.nextCursor,
                previousCursor: decodedBody.previousCursor,
            };
            if (decodedBody.pageSize) {
                state.pageSize = decodedBody.pageSize;
            }
            return state;
        }

        // Not paginated - could be a single record result
        return false;
    }
}
