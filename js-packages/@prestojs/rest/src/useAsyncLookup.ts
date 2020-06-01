import { useAsync } from '@prestojs/util';
import isEqual from 'lodash/isEqual';
import { useEffect, useRef } from 'react';
import { PaginatorInterface } from './Paginator';

/**
 * @expand-properties
 */
type UseAsyncLookupProps<T> = {
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
     * Optional paginator if response is paginated. This will be monitored for
     * any state changes which will trigger a call to `execute`.
     *
     * Required if `accumulatePages` is true.
     */
    paginator?: PaginatorInterface | null;
    /**
     * Asynchronous function that returns the result for the query. Passed an
     * object with `query` and `paginator` keys.
     */
    execute: (props: {
        query?: Record<string, boolean | string | null | number>;
        paginator?: null | PaginatorInterface;
    }) => Promise<T>;
};

type UseAsyncLookupReturn<T> = {
    result: T | null;
    /**
     * True while `execute` call is in progress.
     */
    isLoading: boolean;
    /**
     * The same `paginator` passed in to `useAsyncLookup`
     */
    paginator: null | PaginatorInterface;
    /**
     * Set to the rejected value of the promise. Only one of `error` and `response` can be set. If
     * `isLoading` is true consider this stale (ie. based on _previous_ props). This can be useful
     * when you want the UI to show the previous value until the next value is ready.
     */
    error: null | Error;
    /**
     * A function to manually trigger the action. If `options.trigger` is `MANUAL`
     * calling this function is the only way to trigger the action.
     *
     * This function will return a promise that resolves/rejects to same value
     * returned by `execute`. If `accumulatePages` is set the value returned is
     * the accumulated value.
     */
    run: (...args) => Promise<any>;
    /**
     * When called will unset result and error to null. Will not immediately trigger
     * a call to the action but subsequent changes to query or paginator will according
     * to the value of `trigger`.
     */
    reset: () => void;
};

/**
 * Execute an asynchronous call and return the value which can optionally be paginated.
 *
 * If the response is paginated you can pass `paginator`. Whenever the paginator state
 * is changed the function will be called unless `trigger` is `MANUAL`. You can pass
 * `accumulatePages` to accumulate results for sequential pages returned from `execute`.
 * This is useful to implement things like infinite scroll. If a non-sequential page
 * is accessed or `query` changes then accumulated results will be cleared.
 *
 * @extract-docs
 */
export default function useAsyncLookup<T>({
    trigger,
    query = {},
    accumulatePages = false,
    execute,
    paginator = null,
}: UseAsyncLookupProps<T>): UseAsyncLookupReturn<T> {
    const initialRun = useRef(true);
    const paginationState = paginator?.responseIsSet && paginator?.currentState;
    const nextPaginationStateRef = useRef<{} | null>(null);
    const lastPaginationStateRef = useRef<{} | null>(null);
    const lastQuery = useRef(query);
    const queryChanged = !isEqual(lastQuery.current, query);

    // Tracks whether accumulated values should be reset. We do this as a ref instead
    // of calling dispatch immediately to avoid transitioning the state too
    // early (eg. the UI can still show the previous results while next is loading)
    const shouldResetAccumulatedValues = useRef(false);

    const { run, reset, response, isLoading, error } = useAsync(async () => {
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
        initialRun.current = false;
        const result = await execute({ paginator, query });
        lastPaginationStateRef.current =
            (paginator?.responseIsSet && paginator?.currentState) || null;
        nextPaginationStateRef.current =
            (paginator?.responseIsSet && paginator?.nextState()) || null;
        if (accumulatePages && !Array.isArray(result)) {
            console.warn(
                `accumulatePages is only valid when result is an array - it has been ignored. Received: `,
                result
            );
        }
        if (Array.isArray(result) && accumulatePages && !shouldResetAccumulatedValues.current) {
            return [...(response || []), ...result];
        }
        shouldResetAccumulatedValues.current = false;
        return result;
    });

    const paginationChanged =
        paginationState &&
        (lastPaginationStateRef.current === null ||
            !isEqual(lastPaginationStateRef.current, paginationState));
    const shouldFetch =
        trigger !== 'MANUAL' &&
        // INITIAL_FETCH doesn't pass this check so shouldFetch still becomes true
        !isLoading &&
        (paginationChanged || queryChanged || initialRun.current);

    // Main effect that handles calling endpoint and monitoring changes in pagination
    // state and query state.
    useEffect(() => {
        // Only update cached lastQuery if we are doing a fetch
        if (shouldFetch && queryChanged) {
            lastQuery.current = query;
            // Changing query results in accumulated values being reset
            if (accumulatePages) {
                shouldResetAccumulatedValues.current = true;
            }
        }

        // If trigger is manual and query changes we should reset
        if ((queryChanged || paginationChanged) && trigger === 'MANUAL') {
            lastPaginationStateRef.current =
                (paginator?.responseIsSet && paginator?.currentState) || null;
            reset();
        }
        if (
            paginator?.responseIsSet &&
            queryChanged &&
            !isEqual(paginator.firstState(), paginator.currentState)
        ) {
            // If query has changed we need to reset pagination before we fetch
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
        query,
        run,
        trigger,
        reset,
        paginationChanged,
    ]);

    return {
        run,
        reset,
        result: response,
        isLoading,
        paginator,
        error,
    };
}
