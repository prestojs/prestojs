import CursorPaginator, { CursorPaginationState } from './CursorPaginator';
import LimitOffsetPaginator, { LimitOffsetPaginationState } from './LimitOffsetPaginator';
import PageNumberPaginator, { PageNumberPaginationState } from './PageNumberPaginator';
import {
    PaginationRequestDetails,
    PaginatorInterface,
    PaginatorRequestOptions,
    PaginatorStatePair,
} from './Paginator';

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
 * @menu-group Pagination
 * @extract-docs
 */
export default class InferredPaginator<
    InferredPaginatorT extends CursorPaginator | PageNumberPaginator | LimitOffsetPaginator =
        | CursorPaginator
        | PageNumberPaginator
        | LimitOffsetPaginator
> implements
        PaginatorInterface<InferredPaginatorT['currentState'], InferredPaginatorT['internalState']>
{
    __paginator?: InferredPaginatorT;
    get responseIsSet(): boolean {
        return !!this.internalState?.responseIsSet;
    }

    /**
     * The underlying inferred paginator instance (if known). Only available after `setResponse` has been called.
     */
    get paginator(): undefined | InferredPaginatorT {
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

    set paginator(paginator: undefined | InferredPaginatorT) {
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

    currentState: InferredPaginatorT['currentState'];
    internalState: InferredPaginatorT['internalState'] & {
        paginatorClass?: any;
        responseIsSet?: boolean;
    };
    setCurrentState: (nextValue: InferredPaginatorT['currentState']) => void;
    setInternalState: (set: InferredPaginatorT['internalState']) => void;

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
        [currentState, setCurrentState]: PaginatorStatePair<InferredPaginatorT['currentState']>,
        [internalState, setInternalState]: PaginatorStatePair<InferredPaginatorT['internalState']>
    ): void {
        this.currentState = currentState || {};
        this.setCurrentState = (nextState): void => {
            // If multiple setCurrentState occur before the first is committed then
            // any reads of `this.currentState` will return the previous value (the
            // last time `replaceStateControllers` was called). Update the `currentState`
            // immediately when `setCurrentState` is called. This ensures any reads
            // use the latest value until it's replaced by the next call to
            // `replaceStateControllers`.
            // TODO: https://github.com/prestojs/prestojs/issues/176
            this.currentState = nextState;
            setCurrentState(nextState);
        };
        this.internalState = internalState || {};
        this.setInternalState = (nextState): void => {
            // As the paginator can be recreated at any time all persistent state has to be in internalState. As such
            // we just store the class to use in internalState. When we access `paginator` we create a new instance
            // as required.
            const paginatorClass = this.paginator ? this.paginator.constructor : null;
            this.internalState = {
                ...nextState,
                responseIsSet: true,
                paginatorClass,
            };
            setInternalState(this.internalState);
        };
        if (this.paginator) {
            this.paginator.replaceStateControllers(
                // @ts-ignore
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

    /**
     * Returns true if there's more results after the current page
     */
    hasNextPage(): boolean {
        if (!this.paginator) {
            return false;
        }
        return this.paginator.hasNextPage();
    }

    /**
     * Returns true if there's a previous page
     */
    hasPreviousPage(): boolean {
        if (!this.paginator) {
            return false;
        }
        return this.paginator.hasPreviousPage();
    }

    getRequestInit(currentInit): PaginatorRequestOptions {
        if (this.paginator) {
            return this.paginator.getRequestInit(currentInit);
        }
        return {
            ...currentInit,
            query: {
                ...this.currentState,
                ...currentInit.query,
            },
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
            if ('nextCursor' in response || 'previousCursor' in response) {
                paginatorClass = CursorPaginator;
            } else if ('limit' in response) {
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this.paginator.setResponse(response);
    }

    static getPaginationState(
        requestDetails: PaginationRequestDetails
    ): Record<string, any> | false {
        return (
            CursorPaginator.getPaginationState(requestDetails) ||
            LimitOffsetPaginator.getPaginationState(requestDetails) ||
            PageNumberPaginator.getPaginationState(requestDetails)
        );
    }
}
