import ViewModel, { PrimaryKey, CompoundPrimaryKey } from './ViewModel';

/**
 * Points to a record that is cached already. The purpose of this is to have a single object
 * in memory and only clone it as needed (eg. a single instance of the RecordPointer is stored
 * on multiple other cache keys). We could do it by storing the record directly but we'd then
 * have to check if the _assignedFields is what we expect and then clone - it's easier and faster
 * to just check if it's an instanceof RecordPointer
 */
class RecordPointer<T extends ViewModel> {
    record: T;
    constructor(record: T) {
        this.record = record;
    }
}

type PrimaryKeyCacheKey = string | number;
type FieldNameCacheKey = string;

/**
 * Is `a` a subset of `b`?
 */
function isSubset(a: string[], b: string[]): boolean {
    return a.filter(f => b.includes(f)).length === a.length;
}

/**
 * Sorts the pairs returns from RecordCache.lastRecord in order of highest count
 */
function sortPairsOnCounter(a: [string, number], b: [string, number]): number {
    if (a[1] < b[1]) {
        return 1;
    }
    if (a[1] > b[1]) {
        return -1;
    }
    return 0;
}

type ChangeListener<T> = (previous?: T, next?: T) => void;
type MultiChangeListener<T> = (previous?: (T | null)[], next?: (T | null)[]) => void;
type ChangeListenerUnsubscribe = () => void;

// Separator used to join multiple values when generating a string key, eg.
// ['a', 'b', 'c'] becomes 'a⁞b⁞c'
const CACHE_KEY_FIELD_SEPARATOR = '⁞';

/**
 * A cache for a single record as identified by it's primary key. This caches the
 * different record instances for all the different possible permutations of fields
 * a record can accept. We don't create these records up front, rather we:
 *
 * 1) When a new or updated record is cached it is set in `cache`
 * 2) We iterate over all other keys that are set (where a key is the field names set
 *    for that cached record) and set them to a `RecordPointer` if they are a subset of
 *    the fields for the record added in 1.
 * 3) We store in `latestRecords` a tuple of the cache key and an incremented counter.
 *    This is used to identify the most recent record set for a given set of fields.
 *    This is used in get described below
 *
 * When getting a record we:
 *
 * 1) Check if it exists already in `cache`
 * 2) If it exists but is an instance of `RecordPointer` we clone the linked record
 *    otherwise we return the record directly
 * 3) If it doesn't exist we iterate over the entries in `latestRecords` in descending
 *    order of value (which is the counter incremented in step 3 above). If we encounter
 *    an entry that is a superset of the fields being retrieved we clone that record
 *    and return it.
 * 4) Otherwise we return null
 **/
class RecordCache<T extends ViewModel> {
    cache: Map<FieldNameCacheKey, T | RecordPointer<T>>;
    cacheListeners: Map<FieldNameCacheKey, ChangeListener<T>[]>;
    latestRecords: { [fieldsKey: string]: number };
    counter = 0;

    constructor() {
        this.cache = new Map();
        this.cacheListeners = new Map();
        this.latestRecords = {};
    }

    /**
     * Return the key to use into `cache` for the specified field names
     */
    private getCacheKey(fieldNames: string[]): string {
        const f = [...fieldNames];
        f.sort();
        return f.join(CACHE_KEY_FIELD_SEPARATOR);
    }

    /**
     * Take a cache key generated with `getCacheKey` and return the list of fields
     */
    private reverseCacheKey(fieldsKey: string): string[] {
        return fieldsKey.split(CACHE_KEY_FIELD_SEPARATOR);
    }

    /**
     * Set a value for the specified key notifying any listeners
     */
    private setValueForKey(
        key,
        value: T | RecordPointer<T> | null
    ): Map<string, T | RecordPointer<T>> | null {
        let before = this.cache.get(key) || null;
        let ret;

        if (this.cacheListeners.has(key)) {
            if (value instanceof RecordPointer) {
                // If we have a listener on a key but it's currently a pointer we
                // need to clone it to a real record so we can pass it through to
                // the callbacks.
                const fieldNames = this.reverseCacheKey(key);
                const record = value.record.clone(fieldNames);
                return this.setValueForKey(key, record);
            } else {
                if (before instanceof RecordPointer) {
                    // If the previous value was a pointer we need to create a record for it
                    // to pass through as the previous value. We don't need to cache it
                    // anywhere as it represents the previous value - the new value is set
                    // below.
                    const fieldNames = this.reverseCacheKey(key);
                    before = before.record.clone(fieldNames);
                }
                if (before === value) {
                    return null;
                }
                if (before && value && before.isEqual(value)) {
                    return null;
                }
                if (value === null) {
                    ret = this.cache.delete(key);
                } else {
                    ret = this.cache.set(key, value);
                }
                // Can't workout what I need to do here to get it to typecheck. Doesn't like
                // RecordPointer<T> but check above should ensure before is always type T
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                this.cacheListeners.get(key).forEach(cb => cb(before, value));
            }
        } else {
            if (value === null) {
                ret = this.cache.delete(key);
            } else {
                ret = this.cache.set(key, value);
            }
        }

        return ret;
    }

    /**
     * Add a record to the cache based on the fields that are set on it.
     *
     * This will also update any cached entries for records that contain only
     * a subset of the fields set on `record. Note that this does not update
     * a superset of fields, ie. updating fields (a,b) won't update a record
     * that contains (a,b,c)
     */
    add(record: T): Map<string, T | RecordPointer<T>> | null {
        const fieldNames = record._assignedFields;
        const fieldsKey = this.getCacheKey(fieldNames);
        this.latestRecords[fieldsKey] = this.counter++;
        const pointer = new RecordPointer(record);
        for (const key of [...this.cache.keys(), ...this.cacheListeners.keys()]) {
            const f = this.reverseCacheKey(key);
            if (isSubset(f, fieldNames)) {
                this.setValueForKey(key, pointer);
            }
        }
        return this.setValueForKey(fieldsKey, record);
    }

    /**
     * Get the cached record for the specified field names
     */
    get(fieldNames: string[]): T | null {
        const fieldsKey = this.getCacheKey(fieldNames);
        if (!this.cache.has(fieldsKey)) {
            // No cache entries exist but there may be cached records that
            // are a superset of the fields requested. Check for this now.
            const pairs = Object.entries(this.latestRecords);
            pairs.sort(sortPairsOnCounter);
            for (const [key] of pairs) {
                let record = this.cache.get(key);
                if (!record) {
                    // This is certainly a bug (this check is also to appease typescript)
                    console.error(
                        'Value for key ${key} is missing in cache but exists in latestRecords. This is a bug.'
                    );
                    continue;
                }
                if (record instanceof RecordPointer) {
                    record = record.record;
                }
                if (isSubset(fieldNames, record._assignedFields)) {
                    // Create a new record with subset of fields and cache
                    // it so that we maintain object equality if you fetch
                    // this entry from the cache multiple times
                    const newRecord = record.clone(fieldNames);
                    this.setValueForKey(fieldsKey, newRecord);
                    return newRecord;
                }
            }
            return null;
        }

        const recordOrPointer = this.cache.get(fieldsKey);
        if (recordOrPointer instanceof RecordPointer) {
            // If a pointer to a record with a superset of fields exists then
            // clone that record with just the fields requested.
            const record = recordOrPointer.record.clone(fieldNames);
            this.setValueForKey(fieldsKey, record);
            return record;
        }
        return recordOrPointer || null;
    }

    /**
     * Delete a record for the specified field names.
     *
     * Returns true if anything was deleted otherwise false
     */
    delete(fieldNames?: string[]): boolean {
        if (!fieldNames) {
            for (const key of this.cache.keys()) {
                this.setValueForKey(key, null);
                delete this.latestRecords[key];
            }
            return true;
        }
        const fieldsKey = this.getCacheKey(fieldNames);
        if (!this.cache.has(fieldsKey)) {
            return false;
        }
        this.setValueForKey(fieldsKey, null);
        delete this.latestRecords[fieldsKey];
        return true;
    }

    /**
     * Add a listener for any changes, additions or deletions for the specified field names
     * @param fieldNames field names to listen to any changes for
     * @param listener Function to call with any changes
     */
    addListener(fieldNames: string[], listener: ChangeListener<T>): ChangeListenerUnsubscribe {
        const fieldsKey = this.getCacheKey(fieldNames);
        let listeners = this.cacheListeners.get(fieldsKey);
        if (!listeners) {
            listeners = [];
            this.cacheListeners.set(fieldsKey, listeners);
        }
        listeners.push(listener);
        return (): void => {
            if (listeners) {
                const index = listeners.indexOf(listener);

                if (index !== -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }
}

/**
 * Cache for ViewModel instances based on the specified field names set.
 *
 * The key to the cache is the primary key for the record and the field names
 * set on it. For example if you have a record that accepts id, name and email
 * you could have a record cached for id, for name, for email or any
 * combination of the 3 fields. This is to handle the common case of fetching
 * partial data from a backend.
 *
 * The cache implementation will update any cache entries that are a subset
 * of a new cache entry. eg. Caching a record with all the possible fields set
 * would result in all the existing partial field cache entries being updated
 * to match the data on the full record for the fields it care about.
 *
 * Usage:
 *
 * ```js
 * // Assume User is a ViewModel already defined
 *
 * // Add a record
 * User.cache.add(new User({ id: 1, name: 'John' }));
 *
 * // Retrieve a record
 * const record = User.cache.get(1, ['id', 'name']);
 *
 * // To update a record just add it again
 * User.cache.add(new User({ id: 1, name: 'Johnny' }));
 *
 * // Cache is per unique set of fields but a superset will update a subset
 * User.cache.add(new User({ id: 1, name: 'Johnny Smith', email: 'johnny@test.com' }));
 * User.cache.get(1, ['id', 'name']);
 * // { id: 1, name: 'Johnny Smith' }
 * User.cache.get(1, ['id', 'name', 'email'])
 * // { id: 1, name: 'Johnny Smith', email: 'johnny@test.com' }
 *
 * // Delete a specific cache for a subset of fields
 * User.cache.delete(1, ['id', 'name']);
 * User.cache.get(1, ['id', 'name']);
 * // null
 * User.cache.get(1, ['id', 'name', 'email'])
 * // { id: 1, name: 'Johnny Smith', email: 'johnny@test.com' }
 *
 * // Or all fields
 * User.cache.delete(1);
 * User.cache.get(1, ['id', 'name', 'email'])
 * // null
 *
 * // You can add multiple values at a time
 * User.cache.addList([johnny, sam]);
 *
 * // You can listen to changes
 * User.cache.addListener(2, ['id', 'name'], (previous, next) => console.log(previous, 'change to', next));
 * User.cache.add(new User({ id: 2, name: 'Bob' }));
 * // null changed to User({ id: 2, name: 'Bob' })
 * User.cache.add(new User({ id: 2, name: 'Bobby' }));
 * // User({ id: 2, name: 'Bob' }) changed to User({ id: 2, name: 'Bobby' })
 * User.cache.delete(2)
 * // User({ id: 2, name: 'Bobby' }) changed to null
 *
 * // You can listen to multiple changes. If you use this and addList then you only get one
 * // call for each change that occurs within addList
 * User.cache.addListenerList(
 *  // Ids to listen for changes to
 *  [3, 4],
 *  // Only get updates for cached records with these field names
 *  ['id', 'name'],
 *  (previous, next) => console.log(previous, 'change to', next)
 * );
 * User.cache.addList([new User({ id: 3, name: 'Jay' }), new User({ id: 4, name: 'Bee' })]);
 * // [null, null] changed to [new User({ id: 3, name: 'Jay' }), new User({ id: 4, name: 'Bee' })]
 * User.cache.addList([new User({ id: 3, name: 'Jayz' }), new User({ id: 4, name: 'Beeb' })]);
 * // [new User({ id: 3, name: 'Jay' }), new User({ id: 4, name: 'Bee' })] changed to [new User({ id: 3, name: 'Jayz' }), new User({ id: 4, name: 'Beeb' })]
 * User.cache.delete(3)
 * // [new User({ id: 3, name: 'Jayz' }), new User({ id: 4, name: 'Beeb' })] changed to [null, new User({ id: 4, name: 'Beeb' })]
 * ```
 */
export default class ViewModelCache<T extends ViewModel> {
    cache: Map<PrimaryKeyCacheKey, RecordCache<T>>;

    constructor() {
        this.cache = new Map();
    }

    /**
     * Get the cache key to use into for the primary key. Handles compound keys.
     */
    private getPkCacheKey(pk: PrimaryKey | CompoundPrimaryKey): string | number {
        if (Array.isArray(pk)) {
            return pk.join(CACHE_KEY_FIELD_SEPARATOR);
        }
        return pk;
    }

    /**
     * Add a record to the cache. Records are cached based on the fields that are
     * set on them (`record._assignedFields`).
     *
     * If record A has a superset of fields of record B then when A is cached it
     * will update the cache for record B. The reverse isn't true.
     *
     * @param record The record to cache
     */
    add(record: T): void {
        if (!record._assignedFields) {
            throw new Error('_assignedFields not set on record; cannot be cached');
        }
        const pkKey = this.getPkCacheKey(record._pk);
        let recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            recordCache = new RecordCache();
            this.cache.set(pkKey, recordCache);
        }
        recordCache.add(record);
    }

    isAddingList = false;
    onAddingListDone?: null | (() => void);

    /**
     * Add a list of records. Use this in place of manually calling
     * add() on each record individually so that listeners only get
     * notified once of the change to the list rather than for
     * each record in the list.
     */
    addList(record: T[]): void {
        this.isAddingList = true;
        try {
            record.forEach(record => this.add(record));
            this.isAddingList = false;
            if (this.onAddingListDone) {
                this.onAddingListDone();
                this.onAddingListDone = null;
            }
        } catch (e) {
            this.onAddingListDone = null;
            this.isAddingList = false;
            throw e;
        }
    }

    /**
     * Get a record with the specified `fieldNames` set from the cache
     *
     * @param pk the primary key of the record to get
     * @param fieldNames the field names to use to look up the cache entry
     *
     * @returns The cached record or null if none found
     */
    get(pk: PrimaryKey | CompoundPrimaryKey, fieldNames: string[]): T | null {
        const pkKey = this.getPkCacheKey(pk);
        const recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            return null;
        }
        return recordCache.get(fieldNames);
    }

    /**
     * Get a list of records with the specified `fieldNames` set from the cache
     *
     * Any record that is not found will end up in the array as a null value. If this
     * isn't desired you must filter them manually.
     *
     * @param pks An array of primary keys
     * @param fieldNames the field names to use to look up the cached entries
     * @returns an array of the cached records. Any records not found will be in
     * the array as a null value
     */
    getList(pks: (PrimaryKey | CompoundPrimaryKey)[], fieldNames: string[]): (T | null)[] {
        const records: (T | null)[] = [];
        for (const pk of pks) {
            records.push(this.get(pk, fieldNames));
        }
        return records;
    }

    /**
     * Delete a record from the cache, optionally only for the specified `fieldNames`
     *
     * If `fieldNames` is omitted then the cache for the record is cleared in it's entirety.
     *
     * @param pk The primary key of the record to delete
     * @param fieldNames Optionally only delete the entry with the specified field names. If
     * this is not set then all data for the record is removed.
     *
     * @returns true if anything was removed, false otherwise
     */
    delete(pk: PrimaryKey | CompoundPrimaryKey, fieldNames?: string[]): boolean {
        const pkKey = this.getPkCacheKey(pk);
        const recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            return false;
        }
        return recordCache.delete(fieldNames);
    }

    /**
     * Add a listener for any changes, additions or deletions for the record identified by
     * `pk` for the field names `fieldNames`
     * @param pk Primary key that identifies the record to listen to changes/additions/deletions to
     * @param fieldNames Field names to listen to changes/additions/deletions to
     * @param listener Function to call with any changes
     */
    addListener(
        pk: PrimaryKey | CompoundPrimaryKey,
        fieldNames: string[],
        listener: ChangeListener<T>
    ): ChangeListenerUnsubscribe {
        const pkKey = this.getPkCacheKey(pk);
        let recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            recordCache = new RecordCache();
            this.cache.set(pkKey, recordCache);
        }
        return recordCache.addListener(fieldNames, listener);
    }

    // TODO: This could probably be part of the above interface; if `pk` is an array
    // do what this does. Currently CompoundPrimaryKey is an array; I'd like to change
    // this to an object. Once that is done we can differentiate between a compound key
    // and an array of pks.
    addListenerList(
        pks: (PrimaryKey | CompoundPrimaryKey)[],
        fieldNames: string[],
        listener: MultiChangeListener<T>
    ): ChangeListenerUnsubscribe {
        let previous = pks.map(pk => this.get(pk, fieldNames));
        const cb = (): void => {
            const next = pks.map(pk => this.get(pk, fieldNames));
            if (this.isAddingList) {
                // When we are adding a list of records we wait until it finishes before
                // notifying the listener. We need to cache the value of 'previous'
                // at the time the first change is detected and pass that through once
                // the list has been added.
                if (!this.onAddingListDone) {
                    const firstPrevious = previous;
                    this.onAddingListDone = (): void => {
                        listener(
                            firstPrevious,
                            pks.map(pk => this.get(pk, fieldNames))
                        );
                    };
                }
            } else {
                listener(previous, next);
            }
            previous = [...next];
        };
        const unsubscribes = pks.map(pk =>
            this.addListener(pk, fieldNames, () => {
                cb();
            })
        );

        return (): void => {
            unsubscribes.forEach(cb => cb());
        };
    }
}
