// @flow
import { useEffect, useRef } from 'react';
import ViewModel from './ViewModel';

export const ADD = 'ADD';
export const UPDATE = 'UPDATE';
export const DELETE = 'DELETE';

type ChangeType = 'ADD' | 'UPDATE' | 'DELETE';

type Options = {
    /**
     * If true then when any records are added it will call `run` with 'ADD'
     * as the first parameter.
     */
    runOnAdd?: boolean;
    /**
     * If true then when any records are deleted it will call `run` with 'DELETE'
     * as the first parameter.
     */
    runOnDelete?: boolean;
    /**
     * If true then when any records are updated it will call `run` with 'UPDATE'
     * as the first parameter.
     */
    runOnUpdate?: boolean;
    /** If true will pass through diff object to `run` on second parameter */
    includeDiff?: boolean;
};

type AddedDiff<T extends ViewModel> = {
    previous: T[];
    added: T[];
};

type UpdatedDiff<T extends ViewModel> = {
    previous: T[];
    updated: T[];
};

type DeletedDiff<T extends ViewModel> = {
    previous: T[];
    deleted: T[];
};

type Diff<T extends ViewModel> = AddedDiff<T> | UpdatedDiff<T> | DeletedDiff<T>;

function isEqual<T extends ViewModel>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (const i in a) {
        if (!a[i].isEqual(b[i])) {
            return false;
        }
    }
    return true;
}

/**
 * Run an effect after a collection of records changes.
 *
 * This works by monitoring the collection of records passed in - it does
 * _not_ listen to changes in a cache. As such make sure you only pass in
 * latest version of records from a cache (eg. by using useViewModelCache).
 * If you pass in records that are cached on your component then no changes
 * in the cache will be detected.
 *
 * @param records The records to monitor for changes. This should usually
 * come from a `useViewModelCache` or another hook that returns data live
 * from he cache. If a falsy value is passed then no changes will be detected.
 * Use this to opt out of checks (for example when a fetch is in progress).
 * @param run The function to call when `records` changes. The first parameter
 * will be one of 'ADD', 'UPDATE' or 'DELETE' depending on the change. If
 * `options.includeDiff` is true then the second parameter will be an object
 * describing the change with the shape:
 *
 * ```
 * {
 *     // Previous version of `records` before the change
 *     previous: [...]
 *     // The record(s) updated
 *     updated: [...],
 *     // The record(s) deleted
 *     deleted: [...],
 *     // The record(s) added
 *     added: [...],
 * }
 * ```
 *
 * One of `updated`, `deleted` or `added` will be set depending on the type
 * of change.
 *
 * Example:
 *
 * ```jsx
 * export default function UserListView() {
 *   const { data, revalidate, isValidating } = useEndpoint(User.endpoints.list);
 *   // Refetch data whenever underlying cache changes
 *   const allRecords = useViewModelCache(User, cache => cache.getAll(fieldList));
 *   // Note that we pass false while data is being fetched from the backend
 *   useViewModelChangeEffect(!isValidating && allRecords, revalidate);
 *   return <ListView records={data} />;
 * }
 * ```
 *
 * @return Has no return value
 *
 * @extract-docs
 */
export default function useViewModelChangeEffect<T extends ViewModel>(
    records: null | T[],
    run: (changeType: ChangeType, diff?: Diff<T>) => void,
    options: Options = {}
): void {
    const {
        runOnAdd = true,
        runOnDelete = true,
        runOnUpdate = true,
        includeDiff = false,
    } = options;
    const lastAllRecordsRef = useRef<T[] | null>(null);
    // This effect handles calling action again if an update, delete or addition happens to
    // the model we are dealing with.
    useEffect(() => {
        const lastAllRecords = lastAllRecordsRef.current;
        if (!lastAllRecords) {
            lastAllRecordsRef.current = records;
            return;
        }
        if (records && lastAllRecords.length < records.length) {
            if (runOnAdd) {
                if (includeDiff) {
                    const diff = records.filter(record => !lastAllRecords.includes(record));
                    run(ADD, {
                        previous: lastAllRecords,
                        added: diff,
                    });
                } else {
                    run(ADD);
                }
            }
        } else if (records && lastAllRecords.length > records.length) {
            if (runOnDelete) {
                if (includeDiff) {
                    const diff = lastAllRecords.filter(record => !records.includes(record));
                    run(DELETE, {
                        previous: lastAllRecords,
                        deleted: diff,
                    });
                } else {
                    run(DELETE);
                }
            }
        } else if (records && runOnUpdate && !isEqual(lastAllRecords, records)) {
            if (includeDiff) {
                const lastRecordsById = lastAllRecords.reduce((acc, record) => {
                    acc[record._pk.toString()] = record;
                    return acc;
                }, {});
                const diff = records.filter(
                    record => !record.isEqual(lastRecordsById[record._pk.toString()])
                );
                run(UPDATE, {
                    previous: lastAllRecords,
                    updated: diff,
                });
            } else {
                run(UPDATE);
            }
        }
        lastAllRecordsRef.current = records;
    }, [runOnAdd, runOnDelete, runOnUpdate, records, run, includeDiff]);
}
