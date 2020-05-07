import { EndpointExecuteOptions } from './Endpoint';
import Paginator from './Paginator';

export type PageNumberPaginationState = {
    page?: string | number;
    pageSize?: string | number;
};
export type InternalPageNumberPaginationState = {
    total: number | null;
};

/**
 * Page number based paginator
 *
 * Expects a `total` and optional `pageSize` key in the response. `total` should be the total number of records
 * available. See [getPaginationState](doc:getPaginationState) for how to customise this if your backend implementation
 * differs.
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
        const nextState = { ...this.currentState, pageSize };
        if (pageSize == null) {
            delete nextState.page;
            delete nextState.pageSize;
        }
        return nextState as PageNumberPaginationState;
    }

    /**
     * Change to the specified page size
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
    getRequestInit({ query, ...options }): EndpointExecuteOptions {
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
        if (pageSize && this.currentState.pageSize !== pageSize) {
            this.setPageSize(pageSize);
        }
    }
}
