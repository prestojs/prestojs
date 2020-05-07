import CursorPaginator, { CursorPaginationState } from './CursorPaginator';
import { EndpointExecuteOptions } from './Endpoint';
import LimitOffsetPaginator, { LimitOffsetPaginationState } from './LimitOffsetPaginator';
import PageNumberPaginator, { PageNumberPaginationState } from './PageNumberPaginator';
import { PaginatorInterface } from './Paginator';

export type PaginatorState =
    | PageNumberPaginationState
    | CursorPaginationState
    | LimitOffsetPaginationState;

/**
 * Class that infers the specific type of pagination based on the response.
 *
 * Supports [PageNumberPaginator](doc:PageNumberPaginator), [LimitOffsetPaginator](LimitOffsetPaginator) and
 * [CursorPaginator](doc:CursorPaginator) with the following rules based on the response data:
 *
 * * If response contains `nextCursor` or `previousCursor` value paginator is set to [CursorPaginator](doc:CursorPaginator)
 * * If response contains `limit` then paginator is set to  [LimitOffsetPaginator](LimitOffsetPaginator)
 * * If response contains `total` then paginator is set to [PageNumberPaginator](doc:PageNumberPaginator)
 *
 * If your backend differs from this implementation then you can transform the shape of your response to conform with
 * the above by providing your own `getPaginationState`
 *
 * ```js
 * import { Endpoint } from '@prestojs/rest';
 *
 * function getPaginationState(paginator, { query, decodedBody }) {
 *    ....
 * }
 *
 * Endpoint.defaultConfig.getPaginationState = getPaginationState;
 * ```
 *
 * See [getPaginationState](doc:getPaginationState) for default implementation used.
 *
 * Alternatively if you only use one type of paginator everywhere in a project you can change the default from
 * `InferredPaginator` in your project entry point (ie. it should happen before any `Endpoint` is used):
 *
 * ```js
 * import { Endpoint } from '@prestojs/rest';
 *
 * Endpoint.defaultConfig.paginatorClass = PageNumberPaginator;
 * ```
 * @menu-group Pagination
 * @extract-docs
 */
export default class InferredPaginator implements PaginatorInterface {
    __paginator?: CursorPaginator | PageNumberPaginator | LimitOffsetPaginator;

    /**
     * The underlying inferred paginator instance (if known). Only available after `setResponse` has been called.
     */
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

    /**
     * The total number of records available. Not valid if inferred paginator is [CursorPaginator](doc:CursorPaginator).
     */
    get total(): number | null {
        if (!this.paginator) {
            return null;
        }
        if (this.paginator instanceof CursorPaginator) {
            return null;
        }
        return this.paginator.total;
    }

    /**
     * The total number of records available. Only valid if inferred paginator is [PageNumberPaginator](doc:PageNumberPaginator).
     */
    get totalPages(): number | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof PageNumberPaginator)) {
            return null;
        }
        return this.paginator.totalPages;
    }

    /**
     * The current limit. Only valid if inferred paginator is [LimitOffsetPaginator](doc:LimitOffsetPaginator).
     */
    get limit(): number | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof LimitOffsetPaginator)) {
            return null;
        }
        return this.paginator.limit;
    }

    /**
     * The current offset. Only valid if inferred paginator is [LimitOffsetPaginator](doc:LimitOffsetPaginator).
     */
    get offset(): number | null {
        if (!this.paginator || !(this.paginator instanceof LimitOffsetPaginator)) {
            return null;
        }
        return this.paginator.offset;
    }

    /**
     * The next cursor. Only valid if inferred paginator is [CursorPaginator](doc:CursorPaginator).
     */
    get nextCursor(): string | null {
        if (!this.paginator || !(this.paginator instanceof CursorPaginator)) {
            return null;
        }
        return this.paginator.nextCursor;
    }

    /**
     * The previous cursor. Only valid if inferred paginator is [CursorPaginator](doc:CursorPaginator).
     */
    get previousCursor(): string | null {
        if (!this.paginator) {
            return null;
        }

        if (!(this.paginator instanceof CursorPaginator)) {
            throw new Error('previousCursor is only valid for CursorPaginator');
        }
        return this.paginator.previousCursor;
    }

    /**
     * The current cursor. Only valid if inferred paginator is [CursorPaginator](doc:CursorPaginator).
     */
    get cursor(): string | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof CursorPaginator)) {
            throw new Error('cursor is only valid for CursorPaginator');
        }
        return this.paginator.cursor;
    }

    /**
     * The current page number. Only valid if inferred paginator is [PageNumberPaginator](doc:PageNumberPaginator).
     */
    get page(): number | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof PageNumberPaginator)) {
            throw new Error('page is only valid for PageNumberPaginator');
        }
        return this.paginator.page;
    }

    /**
     * The current page size. Only valid if inferred paginator is [PageNumberPaginator](doc:PageNumberPaginator).
     */
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

    /**
     * @see documentation for `replaceStateControllers` for what `currentStatePair` and `internalStatePair` are
     */
    constructor(currentStatePair, internalStatePair) {
        if ((currentStatePair || internalStatePair) && !(currentStatePair && internalStatePair)) {
            throw new Error(
                'If one of `currentStatePair` and `internalStatePair` are specified both must be'
            );
        }
        if (currentStatePair && internalStatePair) {
            this.replaceStateControllers(currentStatePair, internalStatePair);
        }
    }

    /**
     * @see `Paginator.replaceStateControllers`
     */
    replaceStateControllers(
        [currentState, setCurrentState],
        [internalState, setInternalState]
    ): void {
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
        if (this.paginator) {
            this.paginator.replaceStateControllers(
                [this.currentState, this.setCurrentState],
                [this.internalState, this.setInternalState]
            );
        }
    }

    /**
     * Only valid if inferred paginator is [PageNumberPaginator](doc:PageNumberPaginator).
     *
     * See [PageNumberPaginator.pageState](doc:PageNumberPaginator#method-pageState)
     */
    pageState(page: number): PageNumberPaginationState | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof PageNumberPaginator)) {
            return null;
        }
        return this.paginator.pageState(page);
    }

    /**
     * Only valid if inferred paginator is [PageNumberPaginator](doc:PageNumberPaginator).
     *
     * See [PageNumberPaginator.setPage](doc:PageNumberPaginator#method-setPage)
     */
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

    /**
     * Only valid if inferred paginator is [PageNumberPaginator](doc:PageNumberPaginator).
     *
     * See [PageNumberPaginator.pageSizeState](doc:PageNumberPaginator#method-pageSizeState)
     */
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

    /**
     * Only valid if inferred paginator is [PageNumberPaginator](doc:PageNumberPaginator).
     *
     * See [PageNumberPaginator.setPageSize](doc:PageNumberPaginator#method-setPageSize)
     */
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

    /**
     * Only valid if inferred paginator is [LimitOffsetPaginator](doc:LimitOffsetPaginator).
     *
     * See [LimitOffsetPaginator.limitState](doc:LimitOffsetPaginator#method-limitState)
     */
    limitState(limit: number | null): LimitOffsetPaginationState | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof LimitOffsetPaginator)) {
            return null;
        }
        return this.paginator.limitState(limit);
    }

    /**
     * Only valid if inferred paginator is [LimitOffsetPaginator](doc:LimitOffsetPaginator).
     *
     * See [LimitOffsetPaginator.setLimit](doc:LimitOffsetPaginator#method-setLimit)
     */
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

    /**
     * Only valid if inferred paginator is [LimitOffsetPaginator](doc:LimitOffsetPaginator).
     *
     * See [LimitOffsetPaginator.offsetState](doc:LimitOffsetPaginator#method-offsetState)
     */
    offsetState(offset: number | null): LimitOffsetPaginationState | null {
        if (!this.paginator) {
            return null;
        }
        if (!(this.paginator instanceof LimitOffsetPaginator)) {
            return null;
        }
        return this.paginator.offsetState(offset);
    }

    /**
     * Only valid if inferred paginator is [LimitOffsetPaginator](doc:LimitOffsetPaginator).
     *
     * See [LimitOffsetPaginator.setOffset](doc:LimitOffsetPaginator#method-setOffset)
     */
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

    /**
     * Return the state for the next page
     *
     * Does not transition state. To transition state call `next` instead.
     */
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

    /**
     * Go to the next page.
     */
    next(): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call next() until pagination type has been inferred (after call to setResponse)'
            );
        }
        return this.paginator.next();
    }

    /**
     * Return the state for the previous page
     *
     * Does not transition state. To transition state call `previous` instead.
     */
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

    /**
     * Go to the previous page.
     */
    previous(): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call previous() until pagination type has been inferred (after call to setResponse)'
            );
        }
        return this.paginator.previous();
    }

    /**
     * Return the state for the first page
     *
     * Does not transition state. To transition state call `first` instead.
     */
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

    /**
     * Go to the first page.
     */
    first(): void {
        if (!this.paginator) {
            throw new Error(
                'Cannot call first() until pagination type has been inferred (after call to setResponse)'
            );
        }
        return this.paginator.first();
    }

    /**
     * Return the state for the first page
     *
     * Does not transition state. To transition state call `last` instead.
     *
     * Not valid for [CursorPaginator](doc:CursorPaginator)
     */
    lastState(): LimitOffsetPaginationState | PageNumberPaginationState | null {
        if (!this.paginator) {
            return null;
        }
        if (this.paginator instanceof CursorPaginator) {
            throw new Error('last() is not valid for CursorPaginator');
        }
        return this.paginator.lastState();
    }

    /**
     * Go to the last page. If the last page isn't yet known (eg. results
     * haven't yet been returned) then null will be returned.
     *
     * If the last page is not yet known because results haven't been returned this function
     * does nothing.
     * Not valid for [CursorPaginator](doc:CursorPaginator)
     */
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

    /**
     * Sets the internal data based on response. This is where the paginator is inferred based on values in the
     * `response`.
     *
     * See [getPaginationState](doc:getPaginationState) for how to customise this if your backend implementation
     * differs.
     */
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
