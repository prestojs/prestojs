import Paginator, { PaginationRequestDetails, PaginatorRequestOptions } from './Paginator';

export type PageNumberPaginationState = {
    page?: string | number;
    pageSize?: string | number;
};
export type InternalPageNumberPaginationState = {
    total?: number | null;
};

/**
 * Page number based paginator
 *
 * See [Paginator](doc:Paginator) for an overview of how state is managed for paginator classes.
 *
 * <Alert type="info">
 *    The default response shape supported by `PageNumberPaginator` is:
 *
 *    ```json
 *    {
 *         // Can also be called 'count'
 *         total: 100,
 *         results: Array,
 *         pageSize: 20,
 *     }
 *     ```
 *
 *    `pageSize` is optional but lets the backend specify what the pageSize used was.
 * </Alert>
 *
 * <Usage>
 *    The basic usage outside of React is:
 *
 *    ```js
 *    let state = {};
 *    const setState = nextState => {
 *        state = nextState;
 *    };
 *    let internalState = {};
 *    const setInternalState = nextState => {
 *        internalState = nextState;
 *    };
 *    const paginator = new PageNumberPaginator([state, setState], [internalState, setInternalState]);
 *    // This would be set after calling the backend
 *    paginator.setResponse({ pageSize: 20, total: 100 });
 *    // state == {page: 1, pageSize: 20}
 *    // internalState == {total: 100, responseIsSet: true}
 *    paginator.next()
 *    // You would call the backend and pass `state`
 *    // state == {page: 2, pageSize: 20}
 *    paginator.setPage(5)
 *    // You would call the backend and pass `state`
 *    // state == {page: 5, pageSize: 20}
 *    ```
 *
 *    To use in a component use the [usePaginator](doc:usePaginator) hook with [paginationMiddleware](doc:paginationMiddleware)
 *    instead. See the [Use with usePaginator & paginationMiddleware](#example-02-use-paginator) example.
 * </Usage>
 *
 * @menu-group Pagination
 * @extract-docs
 */
export default class PageNumberPaginator extends Paginator<
    PageNumberPaginationState,
    InternalPageNumberPaginationState
> {
    /**
     * The total number of results available on the backend
     */
    get total(): number | null {
        if (this.internalState.total == null) {
            return null;
        }
        return this.internalState.total;
    }

    /**
     * The total number of pages
     */
    get totalPages(): number | null {
        if (null == this.total || null == this.pageSize) {
            return null;
        }
        return Math.ceil(this.total / this.pageSize);
    }

    /**
     * The current page
     */
    get page(): number | null {
        const page = this.currentState.page ?? null;
        if (typeof page === 'string') {
            return Number(page);
        }
        if (page == null) {
            // If not set page is assumed to be 1. We do this on access rather
            // than calling setPage() initially to avoid unnecessary re-renders
            // & data fetches from the state transitions
            return 1;
        }
        return page;
    }

    /**
     * The current page size (if known).
     */
    get pageSize(): number | null {
        const pageSize = this.currentState.pageSize ?? null;
        if (typeof pageSize === 'string') {
            return Number(pageSize);
        }
        return pageSize;
    }

    /**
     * Return the state for the specified page number
     *
     * Does not transition state. To transition state call `setPage` instead.
     */
    pageState(page: number): PageNumberPaginationState {
        if (page < 1) {
            throw new Error(`Invalid page ${page} - should be >= 1`);
        }
        return { ...this.currentState, page };
    }

    /**
     * Change to the specified page
     */
    setPage(page: number): void {
        this.setCurrentState(this.pageState(page));
    }

    /**
     * Return the state for the specified page size
     *
     * Does not transition state. To transition state call `setPageSize` instead.
     */
    pageSizeState(pageSize: null | number): PageNumberPaginationState {
        if (pageSize != null && pageSize < 1) {
            throw new Error(`Invalid pageSize ${pageSize} - should be >= 1`);
        }
        // When page size changes we need to alter the page
        if (pageSize != null && this.pageSize && this.pageSize !== pageSize && this.page) {
            const page = Math.max(1, Math.ceil(((this.page - 1) * this.pageSize) / pageSize));
            return { ...this.currentState, pageSize, page };
        }
        const nextState: PageNumberPaginationState = {
            ...this.currentState,
            pageSize: pageSize ?? undefined,
        };
        if (pageSize == null) {
            delete nextState.page;
            delete nextState.pageSize;
        }
        return nextState;
    }

    /**
     * Change to the specified page size
     *
     * > NOTE: This will alter `page` so that it is still valid. For example if
     * > `pageSize` was 10 and you were on page `4`, and then page size was changed
     * > to `20` then page would be adjusted to `2`.
     * >
     * > If you want to change `page` and `pageSize` together call `setPageSize`
     * > first.
     *
     */
    setPageSize(pageSize: null | number): void {
        this.setCurrentState(this.pageSizeState(pageSize));
    }

    /**
     * Return the state for the next page
     *
     * Does not transition state. To transition state call `next` instead.
     */
    nextState(): PageNumberPaginationState {
        return this.pageState((this.page || 1) + 1);
    }

    /**
     * Go to the next page.
     */
    next(): void {
        this.setCurrentState(this.nextState());
    }

    /**
     * Return the state for the previous page
     *
     * Does not transition state. To transition state call `previous` instead.
     */
    previousState(): PageNumberPaginationState {
        return this.pageState((this.page || 1) - 1);
    }

    /**
     * Go to the previous page.
     */
    previous(): void {
        this.setCurrentState(this.previousState());
    }

    /**
     * Return the state for the first page
     *
     * Does not transition state. To transition state call `first` instead.
     */
    firstState(): PageNumberPaginationState {
        return this.pageState(1);
    }

    /**
     * Go to the first page.
     */
    first(): void {
        this.setCurrentState(this.firstState());
    }

    /**
     * Return the state for the first page
     *
     * Does not transition state. To transition state call `last` instead.
     */
    lastState(): PageNumberPaginationState | null {
        if (null == this.total || null == this.pageSize) {
            return null;
        }
        return this.pageState(Math.ceil(this.total / this.pageSize));
    }

    /**
     * Go to the last page. If the last page isn't yet known (eg. results
     * haven't yet been returned) then null will be returned.
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

    /**
     * Adds `page` and `pageSize` into query options passed through to the endpoint
     */
    getRequestInit({ query, ...options }): PaginatorRequestOptions {
        const newQuery = { ...query };
        if (this.currentState.pageSize) {
            newQuery.pageSize = this.currentState.pageSize;
        }
        if (this.currentState.page) {
            newQuery.page = this.currentState.page;
        }
        return {
            query: newQuery,
            ...options,
        };
    }

    /**
     * Sets the internal data based on response. Expects `total` and optionally `pageSize` to be in
     * response data.
     *
     * See [getPaginationState](doc:getPaginationState) for how to customise this if your backend implementation
     * differs.
     */
    setResponse({ total, pageSize }: { total: number; pageSize?: number }): void {
        this.setInternalState({ total });
        if (!this.currentState.page) {
            // If page hasn't been set do so now so `currentState` always contains it after response received.
            this.setPage(1);
        }
        if (pageSize && this.currentState.pageSize !== pageSize) {
            this.setPageSize(pageSize);
        }
    }

    /**
     * Returns true if there's more results after the current page
     */
    hasNextPage(): boolean {
        const { page = 1, pageSize } = this.currentState;
        // Without pageSize can't know if there's another page
        if (!pageSize || !this.internalState.total) {
            return false;
        }
        return Number(page) * Number(pageSize) < this.internalState.total;
    }

    /**
     * Returns true if there's a previous page (i.e. page > 1)
     */
    hasPreviousPage(): boolean {
        const { page = 1 } = this.currentState;
        return page > 1;
    }

    /**
     * See [Paginator.getPaginationState](doc:Paginator#Method-getPaginationState) for details about how this
     * method is used.
     *
     * Expects `decodedBody` to include a key `results` which should be an array of return records and a variable
     * `count` or `total` that contains the total number of records available. Can optionally include `pageSize` which
     * allows the backend to specify what the size of the page is if not explicitly passed. e.g.
     *
     * ```json
     * {
     *     results: Array,
     *     total: 100,
     *     pageSize: 20,
     * }
     * ```
     *
     * @param requestDetails
     */
    static getPaginationState(
        requestDetails: PaginationRequestDetails
    ): Record<string, any> | false {
        const { query, decodedBody } = requestDetails;
        // If it's an array then it's assumed to be unpaginated data
        if (Array.isArray(decodedBody) || !decodedBody) {
            return false;
        }

        // Page number pagination expects a response containing the total number of records (`count`) and
        // an array of results under the `results` key. pageSize is inferred from response where possible.
        const total = 'count' in decodedBody ? decodedBody.count : decodedBody.total;
        if (Array.isArray(decodedBody.results) && typeof total == 'number') {
            let { pageSize } = decodedBody;
            if (!pageSize) {
                const { page } = query || {};
                // Infer page size if we are on first page and total results are greater
                // than returned results
                if (total > decodedBody.results.length && (page === 1 || page == null)) {
                    pageSize = decodedBody.results.length;
                }
            }
            return {
                total,
                results: decodedBody.results,
                pageSize,
            };
        }

        // Not paginated - could be a single record result
        return false;
    }
}
