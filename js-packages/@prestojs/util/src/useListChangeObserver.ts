import { isEqual as defaultIsEqual } from './comparison';
import { getId as defaultGetId, hashId } from './identifiable';
import useChangeObserver, { ChangeObserverOptions } from './useChangeObserver';

export const ADD = 'ADD';
export const UPDATE = 'UPDATE';
export const DELETE = 'DELETE';

/**
 * @expand-properties
 */
type ListChangeObserverOptions<T> = ChangeObserverOptions<T> & {
    /**
     * If true then when any items are added it will call `onChange` with 'ADD'
     * as the first parameter. Only applicable if value is an array.
     */
    runOnAdd?: boolean;
    /**
     * If true then when any records are deleted it will call `onChange` with 'DELETE'
     * as the first parameter. Only applicable if value is an array.
     */
    runOnDelete?: boolean;
    /**
     * If true then when any records are updated it will call `onChange` with 'UPDATE'
     * as the first parameter. Only applicable if value is an array.
     */
    runOnUpdate?: boolean;
    /**
     * Function to get unique ID for an item. This is used to detect modifications to
     * the list. Without this it's unknown whether an item was removed from the list of
     * just changed position.
     *
     * Support for [ViewModel](doc:viewModelFactory) is provided out of the box by checking
     * for the existence of a _key property on any object passed in.
     */
    getId?: (item: T) => string | number;
};

function buildById<T extends any[]>(
    data: T,
    getId?: (item: any) => string | number
): Record<string, T> {
    return data.reduce((acc, item) => {
        acc[hashId(defaultGetId(item, getId))] = item;
        return acc;
    }, {});
}

type Change<T> = {
    [ADD]: false | T[];
    [UPDATE]: false | [T, T][];
    [DELETE]: false | T[];
};

/**
 * @param change An object listing changes. Any additions will be included as an array under `ADD`, any updates
 * as an array of [before, after] tuples under `UPDATE`, and any deletions as an array under `DELETE`.
 * @param lastValue The value before this change
 * @param nextValue The value after this change
 *
 * @returns No return value
 */
type OnChange<T> = (change: Change<T>, lastValue: T, nextValue: T) => void;

/**
 * Call a function whenever values in a list change. This differs from [useChangeObserver](doc:useChangeObserver) by
 * allowing you to choose what changes trigger a call (additions, updates, deletions). In addition, the callback is passed
 * the changed items. In order to achieve this each item in the array needs to have a
 * unique ID which is obtained by calling the `options.getId` function. If the `item` implements the [Identifiable](doc:Identifiable)
 * interface then `getId` is optional. This default implementation is compatible with [ViewModel](doc:viewModelFactory) so you can pass lists of
 * records returned from [useViewModelCache](doc:useViewModelCache).
 *
 * <Usage>
 *
 * A common use case is to call a list endpoint whenever the cache for that view model changes as it could mean
 * a new record was added / modified / deleted which could change the list of records that should be displayed.
 *
 * ```jsx
 * export default function UserListView() {
 *   const { result, run, isLoading } = useAsync(User.endpoints.list.prepare(), { trigger: 'SHALLOW' });
 *   // Refetch data whenever underlying cache changes
 *   const allRecords = useViewModelCache(User, cache => cache.getAll(fieldList));
 *   // NOTE: Usually you don't want multiple useListChangeObserver's on the exact same
 *   // subset of data as you will trigger redundant ajax queries.
 *   // if a record is updated & saved elsewhere, then useViewModelCache will return new
 *   // data which triggers useListChangeObserver. We still want useListChangeObserver()
 *   // to trigger the useEndpoint() revalidate because that record update may have changed the
 *   // order of records or caused it to [no longer] appear in a filtered list of data.
 *   // Also note that we pass false while data is being fetched from the backend
 *   useListChangeObserver(!isLoading && allRecords, run);
 *   return <ListView records={data} />;
 * }
 * ```
 * </Usage>
 *
 * @param value An array of values to monitor for changes. A falsey value can be passed to disable
 * checks. This is the same as passing `options.disabled`. This is convenient for cases where no value
 * is available yet (eg. when waiting for initial response from an API endpoint)
 * @param onChange A method that will be called on any changes. This is passed an object of changes in the form:
 *
 * ```
 * {
 *     ADD: [...],
 *     UPDATE: [[<prev value>, <updated value>]...],
 *     DELETE: [...],
 * }
 * ```
 * Each change type (ADD, UPDATE, DELETE) will be `false` if no value has changed.
 *
 * The last and next list of records are also passed.
 *
 * @return No return value
 *
 * @extract-docs
 */
export default function useListChangeObserver<T extends any[]>(
    value: T | false | null | undefined,
    onChange: OnChange<T>,
    options?: ListChangeObserverOptions<T>
): void {
    const {
        runOnAdd = true,
        runOnDelete = true,
        runOnUpdate = true,
        getId,
        ...otherOptions
    } = options || {};
    // false/null can be passed to disable
    if (!value) {
        otherOptions.disabled = true;
    }
    const { isEqual = defaultIsEqual } = otherOptions;
    function listOnChange(prev: T, next: T): void {
        const changes: Change<T> = {
            [ADD]: false,
            [DELETE]: false,
            [UPDATE]: false,
        };
        const prevById = buildById(prev, getId);
        const nextById = buildById(next, getId);
        const prevIds = Object.keys(prevById);
        for (const id of prevIds) {
            const prevValue = prevById[id];
            const nextValue = nextById[id];
            if (!(id in nextById) && runOnDelete) {
                if (!changes[DELETE]) {
                    changes[DELETE] = [];
                }
                // For some reason the check above doesn't convince typescript that changes[DELETE] can't be false
                (changes[DELETE] as T[]).push(prevValue);
            }
            if (id in nextById && runOnUpdate && !isEqual(prevValue, nextValue)) {
                if (!changes[UPDATE]) {
                    changes[UPDATE] = [];
                }
                (changes[UPDATE] as [T, T][]).push([prevValue, nextValue]);
            }
            delete nextById[id];
        }
        if (runOnAdd) {
            const added = Object.values(nextById);
            if (added.length > 0) {
                changes[ADD] = added;
            }
        }
        if (changes[ADD] || changes[DELETE] || changes[UPDATE]) {
            onChange(changes, prev, next);
        }
    }
    useChangeObserver(value, listOnChange, otherOptions);
}
