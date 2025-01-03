import isEqual from 'lodash/isEqual';
import { useEffect, useRef } from 'react';
import { getId as _identifiableGetId, hashId, Id, Identifiable } from './identifiable';
import useAsync from './useAsync';

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

/**
 * @typeParam ItemType {@inheritTypeParam useAsyncValue}
 * @typeParam IdType {@inheritTypeParam useAsyncValue}
 */
export type UseAsyncValueCommonProps<ItemType, IdType extends Id> = {
    /**
     * An optional array of existing values to try and find the value in.
     *
     * If each item does not implement [Identifiable](doc:Identifiable) then you
     * must provide the `getId` function.
     *
     * You can use this to avoid resolving data that already exists. If dealing with
     * ViewModel instances you can use it with [useViewModelCache](doc:useViewModelCache),
     * eg.
     *
     * ```js
     * const existingValues = useViewModelCache(User, cache => cache.getAll(fieldNames));
     * const { value } = useAsyncValue({ id, existingValues, resolve: fetchUser });
     * ```
     *
     * <Alert>
     *   This is never updated by `useAsyncValue` - if a value is resolved using `resolve`
     *   and then is requested again it will go through `resolve` once more unless `existingValues`
     *   is changed. When using [useViewModelCache](doc:useViewModelCache) this would happen
     *   automatically so long as `resolve` adds the value to the cache (e.g. by using an [Endpoint](doc:Endpoint) with
     *   [viewModelCachingMiddleware](doc:viewModelCachingMiddleware)).
     * </Alert>
     */
    existingValues?: ItemType[];
    /**
     * A function that returns a unique ID for each item in `existingValues`. Only
     * required if each item does not implement [Identifiable](doc:Identifiable).
     *
     * Note that [ViewModel](doc:viewModelFactory) implements this and so isn't required
     * when passing `ViewModel` records.
     */
    getId?: (item: ItemType) => IdType;
    /**
     * When to trigger the fetch. Defaults to `DEEP` which means whenever `id`
     * or `ids` changed it will refetch if the value hasn't already been resolved.
     *
     * If set to `MANUAL` nothing will happen until it changes to `DEEP`. You
     * can use this to defer execution until the value is required.
     */
    trigger?: 'MANUAL' | 'DEEP';
    /**
     * Called when `resolve` resolves successfully. Is passed a single parameter which
     * is the value returned from `resolve`
     */
    onSuccess?: (response: ItemType) => void;
    /**
     * Called when `resolve` errors. Passed the error returned from `resolve`.
     */
    onError?: (error: Error) => void;
};

/**
 * @expandproperties
 * @typeParam ItemType {@inheritTypeParam useAsyncValue}
 * @typeParam IdType {@inheritTypeParam useAsyncValue}
 */
export interface UseAsyncValuePropsSingle<ItemType, IdType extends Id>
    extends UseAsyncValueCommonProps<ItemType, IdType> {
    /**
     * Single `id` for value to fetch or null if nothing yet to resolve.
     *
     * If you need to resolve multiple values use the other form documented
     * below passing `ids` instead.
     */
    id: IdType | null;
    /**
     * Resolve the value for the provided ID. Function is passed a single parameter
     * being `id`.
     *
     * Note that when `trigger` is `DEEP` changes to this function will cause it
     * to be called again, so you must memoize it (.eg. with `useCallback`) if it's
     * defined in your component or hook.
     */
    resolve: (id: IdType) => Promise<ItemType>;
}

/**
 * @expandproperties
 * @typeParam ItemType {@inheritTypeParam useAsyncValue}
 * @typeParam IdType {@inheritTypeParam useAsyncValue}
 */
export interface UseAsyncValuePropsMulti<ItemType, IdType extends Id>
    extends UseAsyncValueCommonProps<ItemType, IdType> {
    /**
     * Array of ids to resolve values for or null if nothing yet to resolve
     *
     * If you need to resolve a single value use the other form documented above
     * passing `id` instead
     */
    ids: IdType[] | null;
    /**
     * Resolve the value for the provided IDs. Function is passed a single parameter
     * being `ids`. Note that if this function is called it will be passed _all_ ids, even
     * if they could be resolved from `existingValues`. If you only want to resolve values
     * not already in `existingValues` you need to handle that here. See [Multiple ViewModel records](#example-02-multiple-values)
     * for an example of doing that.
     */
    resolve: (ids: IdType[]) => Promise<ItemType[]>;
}

/**
 * @typeParam ReturnItemType The type of the return item(s). If `id` is passed it will be a singular type otherwise if `ids` was passed it will be array type.
 */
export type UseAsyncValueReturn<ReturnItemType> = {
    /**
     * Set to the rejected value of the promise. Only one of `error` and `value` can be set. If
     * `isLoading` is true consider this stale (i.e. based on _previous_ props). This can be useful
     * when you want the UI to show the previous value until the next value is ready.
     */
    error: null | Error;
    /**
     * True while `resolve` call is in progress.
     */
    isLoading: boolean;
    /**
     * The resolved item(s) that match the supplied id(s).
     */
    value: ReturnItemType | null;
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
     * When called will set both result and error to null. Will not immediately trigger
     * a call to the action but subsequent changes to query or paginator will according
     * to the value of `trigger`.
     *
     * If value is found in `existingValues` then it will still be returned even if
     * you call `reset` - `reset` only clears values that are returned from `resolve`.
     */
    reset: () => void;
};

/**
 * Specialised version of [useAsync](doc:useAsync) for retrieving value(s) from a local cache (`existingValues`) if
 * available otherwise resolving them from some external source.
 *
 * <Alert>
 *     Unless you are passing `existingValues`, or are writing a hook/component
 *     that may use that option based on its props, you don't need this hook and
 *     should just use [useAsync](doc:useAsync).
 * </Alert>
 *
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
 * @extractdocs
 * @typeParam ItemType The type of the item that matches the id
 * @typeParam IdType The type of the ID (e.g. `number`)
 */
export default function useAsyncValue<ItemType, IdType extends Id>(
    props: UseAsyncValuePropsSingle<ItemType, IdType>
): UseAsyncValueReturn<ItemType>;
/**
 * The second form of `useAsyncValue` that accepts an array of `ids`.
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
 *
 * @typeParam ItemType The type of each item that matches the ids
 * @typeParam IdType The type of the ID (e.g. `number`)
 */
export default function useAsyncValue<ItemType, IdType extends Id>(
    props: UseAsyncValuePropsMulti<ItemType, IdType>
): UseAsyncValueReturn<ItemType[]>;
export default function useAsyncValue<ItemType, IdType extends Id>(
    props: UseAsyncValueCommonProps<ItemType, IdType> & {
        id?: IdType | null;
        ids?: IdType[] | null;
        resolve: (idOrIds: IdType | IdType[]) => Promise<ItemType[] | ItemType>;
    }
): UseAsyncValueReturn<ItemType | ItemType[]> {
    const { id, ids, getId, resolve, trigger = useAsync.DEEP, onSuccess, onError } = props;
    if (id && ids) {
        throw new Error("Only one of 'id' and 'ids' should be provided");
    }
    // Track value of id/ids for purposes of detecting changes
    const idRef = useRef(id || ids);

    let valueInChoices;
    const existingValues = props.existingValues || [];
    if (id || ids) {
        if (ids) {
            const existingIds = existingValues.reduce((acc, item) => {
                acc[hashId(identifiableGetId(item, getId))] = item;
                return acc;
            }, {});
            valueInChoices = [];
            for (const id of ids) {
                const hashedId = hashId(id);
                const item = existingIds[hashedId];
                if (item) {
                    valueInChoices.push(item);
                }
            }
            if (valueInChoices.length !== ids.length) {
                valueInChoices = null;
            }
        } else if (id) {
            for (const item of existingValues) {
                if (hashId(identifiableGetId(item, getId)) == hashId(id)) {
                    valueInChoices = item;
                    break;
                }
            }
        }
    }
    const isValueMissing = (id || ids) && !valueInChoices;
    const {
        run,
        reset,
        isLoading,
        error,
        result: resolvedValue,
    } = useAsync<ItemType | ItemType[], Error>(resolve, {
        args: [id || ids],
        trigger: isValueMissing ? trigger : useAsync.MANUAL,
        onSuccess,
        onError,
    });

    useEffect(() => {
        if (!isEqual(id || ids, idRef.current) && trigger === useAsync.MANUAL) {
            reset();
        }
        idRef.current = id || ids;
    }, [id, ids, reset, trigger]);

    // If we don't have id/ids we should never return a value
    // Otherwise return the value if it exists in existingChoices otherwise value
    // returned from `resolve` (if any)
    let finalValue: ItemType | ItemType[] | null = null;
    if (id || ids) {
        if (valueInChoices) {
            finalValue = valueInChoices;
        } else {
            finalValue = resolvedValue;
        }
    }

    return {
        run,
        reset,
        value: finalValue ?? null,
        isLoading,
        error,
    };
}
