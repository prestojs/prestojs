import { EndpointExecuteOptions } from './Endpoint';
import Paginator, { PaginationStateChangeListener } from './Paginator';

export type CursorPaginationState = {
    pageSize?: number;
    cursor?: string;
};

export default class CursorPaginator extends Paginator {
    nextCursor: string | null = null;
    previousCursor: string | null = null;

    get cursor(): string | null | undefined {
        return this.currentState.cursor;
    }

    get pageSize(): number | null | undefined {
        return this.currentState.pageSize;
    }

    constructor(
        initialState: CursorPaginationState = {},
        onChange?: PaginationStateChangeListener
    ) {
        super(initialState || {}, onChange);
    }

    setPageSize(pageSize: number): void {
        if (pageSize < 1) {
            throw new Error(`Invalid pageSize ${pageSize} - should be >= 1`);
        }
        this.setState(currentState => {
            // If page size changes any next/previous cursors are no invalid
            if (currentState.pageSize !== pageSize) {
                this.nextCursor = null;
                this.previousCursor = null;
            }
            // When page size changes we need to reset the cursor
            if (currentState.pageSize !== pageSize && currentState.cursor) {
                const nextState: CursorPaginationState = { ...currentState, pageSize };
                delete nextState.cursor;
                return nextState;
            }
            return { ...currentState, pageSize };
        });
    }

    first(): void {
        // first page is equivalent to not specifying cursor
        this.setState(currentState => {
            const nextState: CursorPaginationState = { ...currentState };
            delete nextState.cursor;
            return nextState;
        });
    }

    next(): void {
        if (this.nextCursor == null) {
            throw new Error('Cannot go to next page as next cursor is not known');
        }
        this.setState(currentState => ({ ...currentState, cursor: this.nextCursor }));
    }

    previous(): void {
        if (this.previousCursor == null) {
            throw new Error('Cannot go to previous page as previous cursor is not known');
        }
        this.setState(currentState => ({ ...currentState, cursor: this.previousCursor }));
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

    setResponse({
        nextCursor,
        previousCursor,
        pageSize,
    }: {
        nextCursor?: string | null;
        previousCursor?: string | null;
        pageSize?: number;
    }): void {
        this.nextCursor = nextCursor == null ? null : nextCursor;
        this.previousCursor = previousCursor == null ? null : previousCursor;
        if (pageSize && this.currentState.pageSize !== pageSize) {
            this.setState(currentState => ({ ...currentState, pageSize }));
        }
    }

    syncState(state?: CursorPaginationState): void {
        if (!state) {
            return;
        }
        const nextState: CursorPaginationState = {};
        if (state.pageSize && state.pageSize !== this.pageSize) {
            nextState.pageSize = state.pageSize;
        }
        if (state.cursor && state.cursor !== this.cursor) {
            nextState.cursor = state.cursor;
        }
        if (Object.keys(nextState).length > 0) {
            this.setState(currentState => ({ ...currentState, ...nextState }));
        }
    }
}
