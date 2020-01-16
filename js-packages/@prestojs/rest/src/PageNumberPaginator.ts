import { EndpointExecuteOptions } from './Endpoint';
import Paginator from './Paginator';

export type PageNumberPaginationState = {
    page?: number;
    pageSize?: number;
};
export type InternalPageNumberPaginationState = {
    total: number | null;
};

export default class PageNumberPaginator extends Paginator<
    PageNumberPaginationState,
    InternalPageNumberPaginationState
> {
    get total(): number | null {
        if (this.internalState.total == null) {
            return null;
        }
        return this.internalState.total;
    }

    get totalPages(): number | null {
        if (null == this.total || null == this.pageSize) {
            return null;
        }
        return Math.ceil(this.total / this.pageSize);
    }

    get page(): number | null | undefined {
        return this.currentState.page;
    }

    get pageSize(): number | null | undefined {
        return this.currentState.pageSize;
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
        if (
            pageSize != null &&
            this.currentState.pageSize &&
            this.currentState.pageSize !== pageSize &&
            this.currentState.page
        ) {
            const page = Math.max(
                1,
                Math.ceil(((this.currentState.page - 1) * this.currentState.pageSize) / pageSize)
            );
            return { ...this.currentState, pageSize, page };
        }
        const nextState = { ...this.currentState, pageSize };
        if (pageSize == null) {
            delete nextState.page;
            delete nextState.pageSize;
        }
        return nextState as PageNumberPaginationState;
    }

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

    setResponse({ total, pageSize }: { total: number; pageSize?: number }): void {
        this.setInternalState({ total });
        if (pageSize && this.currentState.pageSize !== pageSize) {
            this.setPageSize(pageSize);
        }
    }
}
