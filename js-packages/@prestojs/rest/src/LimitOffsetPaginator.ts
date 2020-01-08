import { EndpointExecuteOptions } from './Endpoint';
import Paginator, { PaginationStateChangeListener } from './Paginator';

export type LimitOffsetPaginationState = {
    limit?: number;
    offset?: number;
};

export default class LimitOffsetPaginator extends Paginator {
    total: number | null = null;

    get limit(): number | null | undefined {
        return this.currentState.limit;
    }

    get offset(): number {
        return this.currentState.offset || 0;
    }

    constructor(
        initialState: LimitOffsetPaginationState = {},
        onChange?: PaginationStateChangeListener
    ) {
        super(initialState || {}, onChange);
    }

    setLimit(limit: number): void {
        if (limit < 1) {
            throw new Error(`Invalid limit ${limit} - should be >= 1`);
        }
        this.setState(currentState => {
            // When page size changes we need to reset the offset
            if (currentState.limit !== limit && currentState.offset) {
                const nextState: LimitOffsetPaginationState = { ...currentState, limit };
                delete nextState.offset;
                return nextState;
            }
            return { ...currentState, limit };
        });
    }

    setOffset(offset: number): void {
        if (offset < 0) {
            throw new Error(`Invalid offset ${offset} - should be >= 0`);
        }
        this.setState(currentState => {
            const nextState: LimitOffsetPaginationState = { ...currentState, offset };
            if (offset === 0) {
                delete nextState.offset;
            }
            return nextState;
        });
    }

    next(): void {
        if (this.limit == null) {
            throw new Error('Cannot go to next page until limit of current results is known');
        }
        this.setOffset(this.offset + this.limit);
    }

    previous(): void {
        if (this.limit == null) {
            throw new Error('Cannot go to next page until limit of current results is known');
        }
        this.setOffset(this.offset - this.limit);
    }

    first(): void {
        this.setState(currentState => {
            const nextState = { ...currentState };
            delete nextState.offset;
            return nextState;
        });
    }

    last(): void {
        if (null == this.total || null == this.limit) {
            throw new Error(
                'Cannot go to last page until limit and total number of results is known'
            );
        }
        const offset = (Math.ceil(this.total / this.limit) - 1) * this.limit;
        this.setState(currentState => ({
            ...currentState,
            offset,
        }));
    }

    getRequestInit({ query, ...options }): EndpointExecuteOptions {
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

    setResponse({ limit, total }): void {
        this.total = total;
        if (limit && this.currentState.limit !== limit) {
            this.setState(currentState => ({ ...currentState, limit }));
        }
    }

    syncState(state?: LimitOffsetPaginationState): void {
        if (!state) {
            return;
        }
        const nextState: LimitOffsetPaginationState = {};
        if (state.limit && state.limit !== this.limit) {
            nextState.limit = state.limit;
        }
        if (state.offset && state.offset !== this.offset) {
            nextState.offset = state.offset;
        }
        if (Object.keys(nextState).length > 0) {
            this.setState(currentState => ({ ...currentState, ...nextState }));
        }
    }
}
