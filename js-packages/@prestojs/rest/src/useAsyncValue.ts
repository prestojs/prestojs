import { getId as _identifiableGetId, hashId, Id, Identifiable, useAsync } from '@prestojs/util';
import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Wrapper around default implementation so we can give more specific error message
 */
function identifiableGetId(item: Identifiable | any, fallbackGetId?: (item: any) => Id): Id {
    try {
        return _identifiableGetId(item, fallbackGetId);
    } catch (err) {
        throw new Error(err.message + ' To fix pass `getId` to `useAsyncValue`.');
    }
}

type CommonProps<T, U extends Id> = {
    /**
     * An optional array of existing values to try and find the value in.
     *
     * If each item does not implement [Identifiable](doc:Identifiable) then you
     * must provide the `getId` function.
     */
    existingValues?: T[];
    /**
     * A function that returns a unique ID for each item in `existingValues`. Only
     * required if each item does not implement [Identifiable](doc:Identifiable).
     */
    getId?: (item: T) => U;
    /**
     * When to trigger the fetch. Defaults to `SHALLOW` which means whenever `id`
     * or `ids` changed it will refetch if the value hasn't already been resolved.
     *
     * If set to `MANUAL` nothing will happen until it changes to `SHALLOW`. You
     * can use this to defer execution until the value is required.
     */
    trigger?: 'MANUAL' | 'SHALLOW';
};

/**
 * @expand-properties
 */
type UseAsyncValuePropsSingle<T, U extends Id> = CommonProps<T, U> & {
    /**
     * Single `id` for value to fetch or null if nothing yet to resolve.
     *
     * If you need to resolve multiple values use the other form documented
     * below passing `ids` instead.
     */
    id: U | null;
    /**
     * Resolve the value for the provided ID. Function is passed a single parameter
     * being `id`.
     */
    resolve: (id: U) => Promise<T>;
};

/**
 * @expand-properties
 */
type UseAsyncValuePropsMulti<T, U extends Id> = CommonProps<T, U> & {
    /**
     * Array of ids to resolve values for or null if nothing yet to resolve
     *
     * If you need to resolve a single value use the other form documented above
     * passing `id` instead
     */
    ids: U[] | null;
    /**
     * Resolve the value for the provided IDs. Function is passed a single parameter
     * being `ids`
     */
    resolve: (ids: U[]) => Promise<T[]>;
};

type UseAsyncValueReturn<T> = {
    /**
     * Set to the rejected value of the promise. Only one of `error` and `value` can be set. If
     * `isLoading` is true consider this stale (ie. based on _previous_ props). This can be useful
     * when you want the UI to show the previous value until the next value is ready.
     */
    error: null | Error;
    /**
     * True while `resolve` call is in progress.
     */
    isLoading: boolean;
    /**
     * The resolved value
     */
    value: T;
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
     *
     * If value is found in `existingValues` then it will still be returned even if
     * you call `reset` - `reset` only clears values that are returned from `resolve`.
     */
    reset: () => void;
};

/**
 * Resolve a value from an id using an async function.
 *
 * For the specified `id` the `resolve` function will be called and should
 * return the value for the specified id.
 *
 * If `existingValues` is provided this will be consulted first before calling
 * `resolve`. This is useful when you have a list of values that may or
 * may not have the data you care about. If it's there then the value will
 * be returned immediately.
 *
 * For multiple values see documentation below.
 *
 * @extract-docs
 */
export default function useAsyncValue<T, U extends Id>(
    props: UseAsyncValuePropsSingle<T, U>
): UseAsyncValueReturn<T>;
/**
 * Resolve values from an array of ids using an async function.
 *
 * For the specified array of `ids` the `resolve` function will be called
 * and should return an array of the same size with each entry being the resolved
 * value for the corresponding id.
 *
 * If `existingValues` is provided this will be consulted first before calling
 * `resolve`. This is useful when you have a list of values that may or
 * may not have the data you care about. If it's there then the values will
 * be returned immediately. Note that if any of the ids are missing from
 * `existingValues` then it will be ignored and a call to `resolve` will be made
 * requesting values for all `ids`.
 */
export default function useAsyncValue<T, U extends Id>(
    props: UseAsyncValuePropsMulti<T, U>
): UseAsyncValueReturn<T[]>;
export default function useAsyncValue<T, U extends Id>(
    props: CommonProps<T, U> & {
        id?: U | null;
        ids?: U[] | null;
        resolve: (idOrIds: U | U[]) => Promise<T[] | T>;
    }
): UseAsyncValueReturn<T | T[]> {
    const { id, ids, existingValues, getId, resolve, trigger } = props;
    if (id && ids) {
        throw new Error("Only one of 'id' and 'ids' should be provided");
    }
    const idRef = useRef(id || ids);
    const resolveRef = useRef(resolve);
    resolveRef.current = resolve;
    let valueInChoices;
    if (existingValues && (id || ids)) {
        if (ids) {
            const existingIds = existingValues.reduce((acc, item) => {
                acc[hashId(identifiableGetId(item, getId))] = item;
                return acc;
            }, {});
            valueInChoices = [];
            for (const id in ids) {
                const item = existingIds[hashId(id)];
                if (!item) {
                    valueInChoices = null;
                    break;
                }
                valueInChoices.push(item);
            }
        } else {
            for (const item of existingValues) {
                if (identifiableGetId(item, getId) === id) {
                    valueInChoices = item;
                    break;
                }
            }
        }
    }
    const isValueMissing = (id || ids) && !valueInChoices;
    const execute = useCallback(id => resolveRef.current(id), []);
    const { run, reset, isLoading, error, response: resolvedValue } = useAsync(execute, {
        args: [id || ids],
        trigger: isValueMissing ? trigger || useAsync.SHALLOW : useAsync.MANUAL,
    });

    useEffect(() => {
        if (!isEqual(id || ids, idRef.current) && trigger === useAsync.MANUAL) {
            reset();
        }
        idRef.current = id || ids;
    }, [id, ids, reset, trigger]);

    // If we don't have id/ids or if trigger is async we should never return a value
    // Otherwise return the value if it exists in existingChoices otherwise value
    // returned from `resolve` (if any)
    const finalValue = id || ids ? resolvedValue || valueInChoices : null;
    return {
        run,
        reset,
        value: finalValue ?? null,
        isLoading,
        error,
    };
}
