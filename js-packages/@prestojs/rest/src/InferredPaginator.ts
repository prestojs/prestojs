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
        if (this.paginator) {
            if (this.paginator instanceof CursorPaginator) {
                return null;
            }
            return this.paginator.total;
        }
        return null;
    }

    get limit(): number | null | undefined {
        if (this.paginator) {
            if (!(this.paginator instanceof LimitOffsetPaginator)) {
                return null;
            }
            return this.paginator.limit;
        }
        return null;
    }

    get offset(): number | null | undefined {
        if (this.paginator) {
            if (!(this.paginator instanceof LimitOffsetPaginator)) {
                return undefined;
            }
            return this.paginator.offset;
        }
    }

    get nextCursor(): string | null | undefined {
        if (this.paginator) {
            if (!(this.paginator instanceof CursorPaginator)) {
                return undefined;
            }
            return this.paginator.nextCursor;
        }
    }

    get previousCursor(): string | null | undefined {
        if (this.paginator) {
            if (!(this.paginator instanceof CursorPaginator)) {
                throw new Error('previousCursor is only valid for CursorPaginator');
            }
            return this.paginator.previousCursor;
        }
    }

    get cursor(): string | null | undefined {
        if (this.paginator) {
            if (!(this.paginator instanceof CursorPaginator)) {
                throw new Error('cursor is only valid for CursorPaginator');
            }
            return this.paginator.cursor;
        }
    }

    get page(): number | null | undefined {
        if (this.paginator) {
            if (!(this.paginator instanceof PageNumberPaginator)) {
                throw new Error('page is only valid for PageNumberPaginator');
            }
            return this.paginator.page;
        }
    }

    get pageSize(): number | null | undefined {
        if (this.paginator) {
            if (this.paginator instanceof LimitOffsetPaginator) {
                throw new Error(
                    'pageSize is not valid for LimitOffsetPaginator. Use limit instead.'
                );
            }
            return this.paginator.pageSize;
        }
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
        if (this.paginator) {
            if (!(this.paginator instanceof PageNumberPaginator)) {
                return null;
            }
            return this.paginator.pageState(page);
        }
        return null;
    }

    setPage(page: number): void {
        if (this.paginator) {
            if (!(this.paginator instanceof PageNumberPaginator)) {
                throw new Error('setPage() is only valid for PageNumberPaginator');
            }
            return this.paginator.setPage(page);
        }
        throw new Error(
            'Cannot call setPage() until pagination type has been inferred (after call to setResponse)'
        );
    }

    pageSizeState(
        pageSize: number | null
    ): CursorPaginationState | PageNumberPaginationState | null {
        if (this.paginator) {
            if (this.paginator instanceof LimitOffsetPaginator) {
                return null;
            }
            return this.paginator.pageSizeState(pageSize);
        }
        return null;
    }

    setPageSize(pageSize: number | null): void {
        if (this.paginator) {
            if (this.paginator instanceof LimitOffsetPaginator) {
                throw new Error('setPageSize() is not valid for LimitOffsetPaginator');
            }
            return this.paginator.setPageSize(pageSize);
        }
        throw new Error(
            'Cannot call setLimit() until pagination type has been inferred (after call to setResponse)'
        );
    }

    limitState(limit: number | null): LimitOffsetPaginationState | null {
        if (this.paginator) {
            if (!(this.paginator instanceof LimitOffsetPaginator)) {
                return null;
            }
            return this.paginator.limitState(limit);
        }
        return null;
    }

    setLimit(limit: number | null): void {
        if (this.paginator) {
            if (!(this.paginator instanceof LimitOffsetPaginator)) {
                throw new Error('setLimit() is only valid for LimitOffsetPaginator');
            }
            return this.paginator.setLimit(limit);
        }
        throw new Error(
            'Cannot call setLimit() until pagination type has been inferred (after call to setResponse)'
        );
    }

    offsetState(offset: number | null): LimitOffsetPaginationState | null {
        if (this.paginator) {
            if (!(this.paginator instanceof LimitOffsetPaginator)) {
                return null;
            }
            return this.paginator.offsetState(offset);
        }
        return null;
    }

    setOffset(offset: number | null): void {
        if (this.paginator) {
            if (!(this.paginator instanceof LimitOffsetPaginator)) {
                throw new Error('setOffset() is only valid for LimitOffsetPaginator');
            }
            return this.paginator.setOffset(offset);
        }
        throw new Error(
            'Cannot call setOffset() until pagination type has been inferred (after call to setResponse)'
        );
    }

    nextState():
        | LimitOffsetPaginationState
        | CursorPaginationState
        | PageNumberPaginationState
        | null {
        if (this.paginator) {
            return this.paginator.nextState();
        }
        return null;
    }

    next(): void {
        if (this.paginator) {
            return this.paginator.next();
        }
        throw new Error(
            'Cannot call next() until pagination type has been inferred (after call to setResponse)'
        );
    }

    previousState():
        | LimitOffsetPaginationState
        | CursorPaginationState
        | PageNumberPaginationState
        | null {
        if (this.paginator) {
            return this.paginator.previousState();
        }
        return null;
    }

    previous(): void {
        if (this.paginator) {
            return this.paginator.previous();
        }
        throw new Error(
            'Cannot call previous() until pagination type has been inferred (after call to setResponse)'
        );
    }

    first(): void {
        if (this.paginator) {
            if (this.paginator instanceof CursorPaginator) {
                throw new Error('first() is not valid for CursorPaginator');
            }
            return this.paginator.first();
        }
        throw new Error(
            'Cannot call first() until pagination type has been inferred (after call to setResponse)'
        );
    }

    last(): void {
        if (this.paginator) {
            if (this.paginator instanceof CursorPaginator) {
                throw new Error('last() is not valid for CursorPaginator');
            }
            return this.paginator.last();
        }
        throw new Error(
            'Cannot call last() until pagination type has been inferred (after call to setResponse)'
        );
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
