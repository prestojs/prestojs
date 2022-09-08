import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useRef } from 'react';
import { PaginatorInterface } from './pagination/Paginator';
import useAsync from './useAsync';

/**
 * @expand-properties
 * @export-in-docs
 */
type UseAsyncListingExecuteProps = {
    /**
     * Any query parameters
     */
    query?: Record<string, boolean | string | null | number>;
    /**
     * The paginator instance, if any
     */
    paginator?: null | PaginatorInterface;
};

/**
 * @expand-properties
 * @export-in-docs
 */
export type UseAsyncListingProps<ResultT> = {
    /**
     * When to trigger the fetch. Defaults to `DEEP` which means whenever a deep
     * equality check on `query` or `paginator` state fails it will refetch.
     *
     * If set to `MANUAL` nothing will happen until it changes to `DEEP` or you
     * call the returned `run` function. You can use this to defer execution until
     * the value is required.
     *
     * Defaults to 'DEEP'.
     */
    trigger?: 'MANUAL' | 'DEEP';
    /**
     * Any query string parameters for the request
     */
    query?: Record<string, boolean | string | null | number>;
    /**
     * Whether to accumulate pages as more results are fetched. For example
     * if the first page of results is returned, then the next page is fetched
     * then the combined results for the first two pages will be resolved.
     *
     * This resets whenever `query` changes or if pagination state changes
     * to anything other than the next page.
     *
     * If this is true you must specify `paginator`.
     */
    accumulatePages?: boolean;
    /**
     * Optional paginator if result is paginated. This will be monitored for
     * any state changes which will trigger a call to `execute`.
     *
     * Required if `accumulatePages` is true.
     */
    paginator?: PaginatorInterface | null;
    /**
     * Asynchronous function that returns the result for the query. Passed an
     * object with `query` and `paginator` keys.
     *
     * Note that when `trigger` is `DEEP` changes to this function will cause it
     * to be called again so you must memoize it (eg. with `useCallback`) if it's
     * defined in your component or hook.
     */
    execute: (props: UseAsyncListingExecuteProps) => Promise<ResultT>;
};

/**
 * @export-in-docs
 */
export type UseAsyncListingReturn<T> = {
    /**
     * True while `execute` call is in progress.
     */
    isLoading: boolean;
    /**
     * The same `paginator` passed in to `useAsyncListing`
     */
    paginator: null | PaginatorInterface;
    /**
     * A function to manually trigger the action. If `options.trigger` is `MANUAL`
     * calling this function is the only way to trigger the action.
     *
     * This function will return a promise that resolves/rejects to same value
     * returned by `execute`. If `accumulatePages` is set the value returned is
     * the accumulated value.
     */
    run: (...args) => Promise<T>;
    /**
     * When called will set both result and error to null. Will not immediately trigger
     * a call to the action but subsequent changes to query or paginator will according
     * to the value of `trigger`.
     */
    reset: () => void;
    /**
     * Set to the rejected value of the promise. Only one of `error` and `result` can be set. If
     * `isLoading` is true consider this stale (i.e. it's the error from the _previous_ props). This can
     * be useful when you want the UI to show the previous value until the next value is ready.
     *
     * Until first call has resolved neither error nor result will be set
     */
    error: null | Error;
    /**
     * The value returned from execute.
     *
     * Only one of `error` and `result` can be set. If `isLoading` is true consider this stale
     * (i.e. it's the result from the _previous_ props). This can be useful when you want the UI to show
     * the previous value until the next value is ready.
     *
     * Until first call has resolved neither error nor result will be set
     */
    result: null | T;
};

/**
 * Specialised version of [useAsync](doc:useAsync) for retrieving a list of paginated values and optionally
 * accumulating them as the next page is retrieved (e.g. for things like [infinite scroll](#example-01-list)).
 *
 * <Alert>
 *     Unless you are using `paginator` with `accumulatePages`, or are writing a hook/component
 *     that may use those options based on its props, you don't need this hook and
 *     should just use [useAsync](doc:useAsync).
 * </Alert>
 *
 * <Usage>
 * While it can work with any async function the typical usage would be to use it with an [Endpoint](doc:Endpoint)
 * that has [paginationMiddleware](doc:paginationMiddleware) applied.
 *
 * ```js
 *  const list = new Endpoint('/list', { middleware: [paginationMiddleware()] });
 *
 *  function Example() {
 *   const paginator = usePaginator(list);
 *   const execute = useCallback(async args => {
 *       return (await list.execute(args)).result;
 *   }, []);
 *   const { result, isLoading, error } = useAsyncListing({
 *       execute,
 *       paginator,
 *       accumulatePages: true,
 *   });
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error error={error} />;
 *
 *   return <List items={result} paginator={paginator} />;
 * }
 * ```
 *
 * See [the infinite scroll demo](#example-01-list) for a full working example.
 * </Usage>
 *
 * @extract-docs
 * @typeParam ResultT The type of the result returned by `execute`.
 */
export default function useAsyncListing<ResultT extends Array<any>>(
    props: UseAsyncListingProps<ResultT>
): UseAsyncListingReturn<ResultT> {
    const {
        trigger = 'DEEP',
        query = {},
        accumulatePages = false,
        execute,
        paginator = null,
    } = props;
    if (accumulatePages && !paginator) {
        throw new Error('When `accumulatePages` is set `paginator` must be provided');
    }
    const initialRun = useRef(true);
    const paginationState = paginator?.responseIsSet && paginator?.currentState;
    const nextPaginationStateRef = useRef<{} | null>(null);
    const lastPaginationStateRef = useRef<{} | null>(null);
    const lastQuery = useRef(query);
    const queryChanged = !isEqual(lastQuery.current, query);
    const lastExecute = useRef(execute);
    const executeChanged = lastExecute.current !== execute;

    // Tracks whether accumulated values should be reset. We do this as a ref instead
    // of calling dispatch immediately to avoid transitioning the state too
    // early (eg. the UI can still show the previous results while next is loading)
    const shouldResetAccumulatedValues = useRef(false);

    const {
        run,
        reset: resetAsync,
        result,
        isLoading,
        error,
    } = useAsync(async (): Promise<ResultT> => {
        // If paginator state has changed to anything except the next value we have to reset accumulator
        if (
            paginator &&
            lastPaginationStateRef.current !== paginator.currentState &&
            !isEqual(nextPaginationStateRef.current, paginator.currentState)
        ) {
            shouldResetAccumulatedValues.current = true;
        }
        // Track query at point of time last fetch occurs so we can detect any
        // changes that occur since last fetch.
        lastQuery.current = query;
        lastExecute.current = execute;
        initialRun.current = false;
        const executeResult = await execute({ paginator, query });
        lastPaginationStateRef.current =
            (paginator?.responseIsSet && paginator?.currentState) || null;
        nextPaginationStateRef.current =
            (paginator?.responseIsSet && paginator?.nextState()) || null;
        if (accumulatePages && !Array.isArray(executeResult)) {
            console.warn(
                `accumulatePages is only valid when result is an array - it has been ignored. Received: `,
                executeResult
            );
        }
        if (
            Array.isArray(executeResult) &&
            accumulatePages &&
            !shouldResetAccumulatedValues.current
        ) {
            return [...(result || []), ...executeResult] as unknown as ResultT;
        }
        shouldResetAccumulatedValues.current = false;
        return executeResult;
    });

    const reset = useCallback(() => {
        // If reset is called we need to reset accumulated values too
        shouldResetAccumulatedValues.current = true;
        resetAsync();
    }, [resetAsync]);

    const paginationChanged =
        paginationState &&
        // First pagination being set should not register as a change - otherwise results will
        // be returned, pagination state set and then change will be detected and require fetching
        // again. If last pagination doesn't exist it's not considered a change.
        lastPaginationStateRef.current !== null &&
        !isEqual(lastPaginationStateRef.current, paginationState);
    const shouldFetch =
        trigger !== 'MANUAL' &&
        // INITIAL_FETCH doesn't pass this check so shouldFetch still becomes true
        !isLoading &&
        (paginationChanged || queryChanged || executeChanged || initialRun.current);

    // Avoid using query as dep to useEffect below as we want to do deep comparison for query -
    // this is handled by `queryChanged`. We can then read the current value from this ref if needed .
    const currentQuery = useRef(query);
    currentQuery.current = query;

    // Main effect that handles calling endpoint and monitoring changes in pagination
    // state and query state.
    useEffect(() => {
        // Only update cached lastQuery if we are doing a fetch
        if (shouldFetch && (queryChanged || executeChanged)) {
            lastQuery.current = currentQuery.current;
            lastExecute.current = execute;
            // Changing query results in accumulated values being reset
            if (accumulatePages) {
                shouldResetAccumulatedValues.current = true;
            }
        }

        // If trigger is manual and query/pagination/execute changes we should reset
        if ((queryChanged || paginationChanged || executeChanged) && trigger === 'MANUAL') {
            lastPaginationStateRef.current =
                (paginator?.responseIsSet && paginator?.currentState) || null;
            resetAsync();
        }
        if (
            paginator?.responseIsSet &&
            (queryChanged || executeChanged) &&
            !isEqual(paginator.firstState(), paginator.currentState)
        ) {
            // If query or execute has changed we need to reset pagination before we fetch
            paginator.first();
            nextPaginationStateRef.current = null;
        } else if (shouldFetch) {
            run();
        }
    }, [
        shouldFetch,
        paginator,
        queryChanged,
        accumulatePages,
        run,
        trigger,
        resetAsync,
        paginationChanged,
        executeChanged,
        execute,
    ]);

    return {
        run,
        reset,
        result,
        isLoading,
        paginator,
        error,
    } as UseAsyncListingReturn<ResultT>;
}
