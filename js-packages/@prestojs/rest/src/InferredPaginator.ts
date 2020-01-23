import CursorPaginator, { CursorPaginationState } from './CursorPaginator';
import { EndpointExecuteOptions } from './Endpoint';
import LimitOffsetPaginator, { LimitOffsetPaginationState } from './LimitOffsetPaginator';
import PageNumberPaginator, { PageNumberPaginationState } from './PageNumberPaginator';
import { PaginatorInterface } from './Paginator';

type PaginatorState =
    | PageNumberPaginationState
    | CursorPaginationState
    | LimitOffsetPaginationState;

export default class InferredPaginator implements PaginatorInterface {
    __paginator?: CursorPaginator | PageNumberPaginator | LimitOffsetPaginator;

    get paginator(): undefined | CursorPaginator | PageNumberPaginator | LimitOffsetPaginator {
        if (!this.__paginator && this.internalState.paginatorClass) {
            this.paginator = new this.internalState.paginatorClass(
                [this.currentState, this.setCurrentState],
                [this.internalState, this.setInternalState]
            );
        }
        if (this.__paginator) {
            return this.__paginator;
        }
    }

    set paginator(
        paginator: undefined | CursorPaginator | PageNumberPaginator | LimitOffsetPaginator
    ) {
        this.__paginator = paginator;
    }

    get total(): number | null {
        if (!this.paginator) {
            return null;
        }
        if (this.paginator instanceof CursorPaginator) {
            return null;
        }
        return this.paginator.total;
    }

    get limit(): number | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof LimitOffsetPaginator)) {
            return null;
        }
        return this.paginator.limit;
    }

    get offset(): number | null {
        if (!this.paginator || !(this.paginator instanceof LimitOffsetPaginator)) {
            return null;
        }
        return this.paginator.offset;
    }

    get nextCursor(): string | null {
        if (!this.paginator || !(this.paginator instanceof CursorPaginator)) {
            return null;
        }
        return this.paginator.nextCursor;
    }

    get previousCursor(): string | null {
        if (!this.paginator) {
            return null;
        }

        if (!(this.paginator instanceof CursorPaginator)) {
            throw new Error('previousCursor is only valid for CursorPaginator');
        }
        return this.paginator.previousCursor;
    }

    get cursor(): string | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof CursorPaginator)) {
            throw new Error('cursor is only valid for CursorPaginator');
        }
        return this.paginator.cursor;
    }

    get page(): number | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof PageNumberPaginator)) {
            throw new Error('page is only valid for PageNumberPaginator');
        }
        return this.paginator.page;
    }

    get pageSize(): number | null {
        if (!this.paginator) {
            return null;
        }
        if (this.paginator instanceof LimitOffsetPaginator) {
            throw new Error('pageSize is not valid for LimitOffsetPaginator. Use limit instead.');
        }
        return this.paginator.pageSize;
    }

    currentState: PaginatorState;
    internalState: Record<string, any>;
    setCurrentState: (nextValue: PaginatorState) => void;
    setInternalState: (set: (internalState: Record<string, any>) => Record<any, string>) => void;

    constructor([currentState, setCurrentState], [internalState, setInternalState]) {
        this.currentState = currentState || {};
        this.setCurrentState = setCurrentState;
        this.internalState = internalState || {};
        this.setInternalState = (nextState): void => {
            // As the paginator can be recreated at any time all persistent state has to be in internalState. As such
            // we just store the class to use in internalState. When we access `paginator` we create a new instance
            // as required.
            const paginatorClass = this.paginator ? this.paginator.constructor : null;
            setInternalState({
                ...nextState,
                paginatorClass,
            });
        };
    }

    pageState(page: number): PageNumberPaginationState | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof PageNumberPaginator)) {
            return null;
        }
        return this.paginator.pageState(page);
    }

    setPage(page: number): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call setPage() until pagination type has been inferred (after call to setResponse)'
            );
        }
        if (!(this.paginator instanceof PageNumberPaginator)) {
            throw new Error('setPage() is only valid for PageNumberPaginator');
        }
        return this.paginator.setPage(page);
    }

    pageSizeState(
        pageSize: number | null
    ): CursorPaginationState | PageNumberPaginationState | null {
        if (!this.paginator) {
            return null;
        }
        if (this.paginator instanceof LimitOffsetPaginator) {
            return null;
        }
        return this.paginator.pageSizeState(pageSize);
    }

    setPageSize(pageSize: number | null): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call setLimit() until pagination type has been inferred (after call to setResponse)'
            );
        }
        if (this.paginator instanceof LimitOffsetPaginator) {
            throw new Error('setPageSize() is not valid for LimitOffsetPaginator');
        }
        return this.paginator.setPageSize(pageSize);
    }

    limitState(limit: number | null): LimitOffsetPaginationState | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof LimitOffsetPaginator)) {
            return null;
        }
        return this.paginator.limitState(limit);
    }

    setLimit(limit: number | null): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call setLimit() until pagination type has been inferred (after call to setResponse)'
            );
        }
        if (!(this.paginator instanceof LimitOffsetPaginator)) {
            throw new Error('setLimit() is only valid for LimitOffsetPaginator');
        }
        return this.paginator.setLimit(limit);
    }

    offsetState(offset: number | null): LimitOffsetPaginationState | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof LimitOffsetPaginator)) {
            return null;
        }
        return this.paginator.offsetState(offset);
    }

    setOffset(offset: number | null): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call setOffset() until pagination type has been inferred (after call to setResponse)'
            );
        }
        if (!(this.paginator instanceof LimitOffsetPaginator)) {
            throw new Error('setOffset() is only valid for LimitOffsetPaginator');
        }
        return this.paginator.setOffset(offset);
    }

    nextState():
        | LimitOffsetPaginationState
        | CursorPaginationState
        | PageNumberPaginationState
        | null {
        if (!this.paginator) {
            return null;
        }
        return this.paginator.nextState();
    }

    next(): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call next() until pagination type has been inferred (after call to setResponse)'
            );
        }
        return this.paginator.next();
    }

    previousState():
        | LimitOffsetPaginationState
        | CursorPaginationState
        | PageNumberPaginationState
        | null {
        if (!this.paginator) {
            return null;
        }
        return this.paginator.previousState();
    }

    previous(): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call previous() until pagination type has been inferred (after call to setResponse)'
            );
        }
        return this.paginator.previous();
    }

    firstState():
        | LimitOffsetPaginationState
        | CursorPaginationState
        | PageNumberPaginationState
        | null {
        if (!this.paginator) {
            return null;
        }
        return this.paginator.firstState();
    }

    first(): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call first() until pagination type has been inferred (after call to setResponse)'
            );
        }
        return this.paginator.first();
    }

    lastState(): LimitOffsetPaginationState | PageNumberPaginationState | null {
        if (!this.paginator) {
            return null;
        }
        if (this.paginator instanceof CursorPaginator) {
            throw new Error('last() is not valid for CursorPaginator');
        }
        return this.paginator.lastState();
    }

    last(): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call last() until pagination type has been inferred (after call to setResponse)'
            );
        }
        if (this.paginator instanceof CursorPaginator) {
            throw new Error('last() is not valid for CursorPaginator');
        }
        return this.paginator.last();
    }

    getRequestInit(currentInit): EndpointExecuteOptions {
        if (this.paginator) {
            return this.paginator.getRequestInit(currentInit);
        }
        return {
            query: {
                ...this.currentState,
                ...currentInit.query,
            },
            ...currentInit,
        };
    }

    setResponse(response: Record<string, any>): void {
        // TODO: Detect change of paginator?
        if (!this.paginator) {
            const args = [
                [this.currentState, this.setCurrentState],
                [this.internalState, this.setInternalState],
            ];
            let paginatorClass;
            if (response.nextCursor || response.previousCursor) {
                paginatorClass = CursorPaginator;
            } else if (response.limit) {
                paginatorClass = LimitOffsetPaginator;
            } else if (response.total != null) {
                paginatorClass = PageNumberPaginator;
            }
            // Typescript didn't understand this as just an else cond
            if (!paginatorClass) {
                throw new Error('Could not infer paginator class from response');
            }
            this.paginator = new paginatorClass(...args);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        return this.paginator.setResponse(response);
    }
}
