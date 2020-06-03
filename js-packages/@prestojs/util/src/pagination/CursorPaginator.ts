import { EndpointExecuteOptions } from '@prestojs/rest/build/module/Endpoint';
import Paginator from './Paginator';

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
 * Expects a `nextCursor`, `previousCursor` and optional `pageSize` key in the response. See
 * [getPaginationState](doc:getPaginationState) for how to customise this if your backend implementation
 * differs.
 *
 * @menu-group Pagination
 * @extract-docs
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
        const nextState = { ...this.currentState, pageSize };
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

    getRequestInit({ query, ...options }): EndpointExecuteOptions {
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
}
