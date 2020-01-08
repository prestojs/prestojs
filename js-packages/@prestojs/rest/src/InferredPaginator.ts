import CursorPaginator, { CursorPaginationState } from './CursorPaginator';
import { EndpointExecuteOptions } from './Endpoint';
import LimitOffsetPaginator, { LimitOffsetPaginationState } from './LimitOffsetPaginator';
import PageNumberPaginator, { PageNumberPaginationState } from './PageNumberPaginator';
import { PaginationStateChangeListener, PaginatorInterface } from './Paginator';

type PaginationState =
    | CursorPaginationState
    | PageNumberPaginationState
    | LimitOffsetPaginationState;

export default class InferredPaginator implements PaginatorInterface {
    onChange?: PaginationStateChangeListener;
    paginator: null | CursorPaginator | PageNumberPaginator | LimitOffsetPaginator = null;
    initialState: Record<string, any>;

    get currentState(): PaginationState | null | undefined {
        return this.paginator?.currentState;
    }

    get total(): number | null | undefined {
        if (this.paginator) {
            if (this.paginator instanceof CursorPaginator) {
                throw new Error('total not valid for cursor pagination');
            }
            return this.paginator.total;
        }
    }

    get limit(): number | null | undefined {
        if (this.paginator) {
            if (!(this.paginator instanceof LimitOffsetPaginator)) {
                throw new Error('limit is only valid for LimitOffsetPaginator');
            }
            return this.paginator.limit;
        }
    }

    get offset(): number | undefined {
        if (this.paginator) {
            if (!(this.paginator instanceof LimitOffsetPaginator)) {
                throw new Error('offset is only valid for LimitOffsetPaginator');
            }
            return this.paginator.offset;
        }
    }

    get nextCursor(): string | null | undefined {
        if (this.paginator) {
            if (!(this.paginator instanceof CursorPaginator)) {
                throw new Error('nextCursor is only valid for CursorPaginator');
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

    constructor(initialState: PaginationState = {}, onChange?: PaginationStateChangeListener) {
        this.initialState = initialState;
        this.onChange = onChange;
    }

    gotoPage(page: number): void {
        if (this.paginator) {
            if (!(this.paginator instanceof PageNumberPaginator)) {
                throw new Error('gotoPage() is only valid for PageNumberPaginator');
            }
            return this.paginator.gotoPage(page);
        }
        throw new Error(
            'Cannot call gotoPage() until pagination type has been inferred (after call to setResponse)'
        );
    }

    setPageSize(pageSize: number): void {
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

    setLimit(limit: number): void {
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

    setOffset(offset: number): void {
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

    next(): void {
        if (this.paginator) {
            return this.paginator.next();
        }
        throw new Error(
            'Cannot call next() until pagination type has been inferred (after call to setResponse)'
        );
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
                ...this.initialState,
                ...currentInit.query,
            },
            ...currentInit,
        };
    }

    setResponse(response: Record<string, any>): void {
        if (!this.paginator) {
            if (response.nextCursor || response.previousCursor) {
                this.paginator = new CursorPaginator({}, this.onChange);
            } else if (response.limit) {
                this.paginator = new LimitOffsetPaginator({}, this.onChange);
            } else if (response.total != null) {
                this.paginator = new PageNumberPaginator({}, this.onChange);
            }
            // Typescript didn't understand this as just an else cond
            if (!this.paginator) {
                throw new Error('Could not infer paginator class from response');
            }
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        return this.paginator.setResponse(response);
    }

    syncState(state?: PaginationState): void {
        if (this.paginator) {
            this.paginator.syncState(state);
        }
    }
}
