import {
    FieldDataMappingRaw,
    isViewModelInstance,
    PrimaryKey,
    ViewModelInterface,
} from './ViewModelFactory';

/**
 * Points to a record that is cached already. The purpose of this is to have a single object
 * in memory and only clone it as needed (eg. a single instance of the RecordPointer is stored
 * on multiple other cache keys). We could do it by storing the record directly but we'd then
 * have to check if the _assignedFields is what we expect and then clone - it's easier and faster
 * to just check if it's an instanceof RecordPointer
 */
class RecordPointer<T extends ViewModelInterface<any, any>> {
    /**
     * This is the value that was replaced by this pointer in the cache. When we actually clone
     * the record we compare against this value - if it's the same we return the original object
     * so that equality checks still hold. This is because we never return the RecordPointer - we
     * only resolve the underlying value as is required. In order to determine whether or not
     * an object is the same requires first cloning it and then comparing it. As such we do that
     * at the time we need the cloned value, not upfront (ie. we don't do it before we store the
     * RecordPointer as that would be lower than doing it lazily - especially if you are updating
     * lots of records)
     */
    currentCachedRecord?: null | T;
    record: T;
    constructor(currentCachedValue: null | undefined | T | RecordPointer<T>, record: T) {
        this.currentCachedRecord =
            currentCachedValue instanceof RecordPointer
                ? currentCachedValue.currentCachedRecord
                : currentCachedValue;
        this.record = record;
    }

    clone(fieldNames: string[]): T {
        // First clone existing record as list of field names may be a subset. When we compare
        // values below we need to only compare the specified fields.
        const cloned = this.record.clone(fieldNames);
        // Check if the value has actually changed from what it used to be. If not we can return
        // the old value so that equality checks still hold.
        if (this.currentCachedRecord && cloned.isEqual(this.currentCachedRecord)) {
            return this.currentCachedRecord;
        }
        return cloned;
    }
}

function isEqual<T extends ViewModelInterface<any, any>>(
    a: null | T | RecordPointer<T>,
    b: null | T | RecordPointer<T>
): boolean {
    if (a == null || b == null) {
        return a === b;
    }
    if (a instanceof RecordPointer) {
        a = a.record;
    }
    if (b instanceof RecordPointer) {
        b = b.record;
    }
    return a.isEqual(b);
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
 * Builds a comparator for sorting entries from an object as returned by Object.entries based on either
 * key (index == 0) or value (index == 1)
 */
function makeEntryComparator(index): (a: [string, number], b: [string, number]) => number {
    const altIndex = index === 0 ? 1 : 0;
    return (a: [string, number], b: [string, number]): number => {
        if (a[index] === b[index]) {
            // Safe to do this as we are comparing entries can't have two where key and value are the same
            return a[altIndex] < b[altIndex] ? 1 : -1;
        }
        if (a[index] < b[index]) {
            return 1;
        }
        if (a[index] > b[index]) {
            return -1;
        }
        return 0;
    };
}

const compareEntriesOnValue = makeEntryComparator(1);
const compareEntriesOnKey = makeEntryComparator(0);

type ChangeListener<T> = (previous?: T, next?: T) => void;
type MultiChangeListener<T> = (previous?: (T | null)[], next?: (T | null)[]) => void;
type ChangeListenerUnsubscribe = () => void;
type AllChangesListener = () => void;

// Separator used to join multiple values when generating a string key, eg.
// ['a', 'b', 'c'] becomes 'a⁞b⁞c'
const CACHE_KEY_FIELD_SEPARATOR = '⁞';

function getFieldNameCacheKey(fieldNames: string[], excludeFields: string[]): string {
    // primary key field names are implicit; never include them in the key itself
    const f = fieldNames.filter(name => !excludeFields.includes(name));
    f.sort();
    return f.join(CACHE_KEY_FIELD_SEPARATOR);
}

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
class RecordCache<T extends ViewModelInterface<any, any>> {
    viewModel: T['_model'];
    pkFieldNames: string[];
    cache: Map<FieldNameCacheKey, T | RecordPointer<T>>;
    cacheListeners: Map<FieldNameCacheKey, ChangeListener<T>[]>;
    latestRecords: { [fieldsKey: string]: number };
    counter = 0;
    onAnyChange: () => void;

    constructor(viewModel: T['_model'], onAnyChange: () => void) {
        this.cache = new Map();
        this.cacheListeners = new Map();
        this.latestRecords = {};
        this.viewModel = viewModel;
        this.pkFieldNames = viewModel.pkFieldNames;
        this.onAnyChange = onAnyChange;
    }

    /**
     * Return the key to use into `cache` for the specified field names
     */
    private getCacheKey(fieldNames: string[]): string {
        return getFieldNameCacheKey(fieldNames, this.pkFieldNames);
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
                const record = value.clone(fieldNames);
                return this.setValueForKey(key, record);
            } else {
                if (before instanceof RecordPointer) {
                    // If the previous value was a pointer we need to create a record for it
                    // to pass through as the previous value. We don't need to cache it
                    // anywhere as it represents the previous value - the new value is set
                    // below.
                    const fieldNames = this.reverseCacheKey(key);
                    before = before.clone(fieldNames);
                }
                if (before === value) {
                    return null;
                }
                if (before && value && isEqual(before, value)) {
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
                if (before === value) {
                    return null;
                }
                if (before && isEqual(before, value)) {
                    this.cache.set(key, before instanceof RecordPointer ? before.record : before);
                    return null;
                } else {
                    ret = this.cache.set(key, value);
                }
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
        const fieldNames = record._assignedFields as string[];
        const fieldsKey = this.getCacheKey(fieldNames);
        this.latestRecords[fieldsKey] = this.counter++;
        let anyChanges = false;
        for (const key of [...this.cache.keys(), ...this.cacheListeners.keys()]) {
            const pointer = new RecordPointer(this.cache.get(key), record);
            const f = this.reverseCacheKey(key);
            if (isSubset(f, fieldNames)) {
                if (this.setValueForKey(key, pointer) != null) {
                    anyChanges = true;
                }
            }
        }
        const ret = this.setValueForKey(fieldsKey, record);
        if (anyChanges || ret != null) {
            // TODO: This will be called sometimes when there's no change... eg. when value is a RecordPointer
            // that actually matches the current data. We currently determine this and optimise it away when
            // we fetch the record rather than when it's cached. Would need to profile this and see if it matters enough
            // or whether we can always check it.
            this.onAnyChange();
        }
        return ret;
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
            pairs.sort(compareEntriesOnValue);
            for (const [key] of pairs) {
                const record = this.cache.get(key);
                if (!record) {
                    // This is certainly a bug (this check is also to appease typescript)
                    console.error(
                        'Value for key ${key} is missing in cache but exists in latestRecords. This is a bug.'
                    );
                    continue;
                }
                const underlyingRecord = record instanceof RecordPointer ? record.record : record;
                if (isSubset(fieldNames, underlyingRecord._assignedFields as string[])) {
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
            const record = recordOrPointer.clone(fieldNames);
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
            let anyDeleted = false;
            for (const key of this.cache.keys()) {
                if (this.setValueForKey(key, null) != null) {
                    anyDeleted = true;
                }
                delete this.latestRecords[key];
            }
            if (anyDeleted) {
                this.onAnyChange();
            }
            return true;
        }
        const fieldsKey = this.getCacheKey(fieldNames);
        if (!this.cache.has(fieldsKey)) {
            return false;
        }
        this.setValueForKey(fieldsKey, null);
        delete this.latestRecords[fieldsKey];
        this.onAnyChange();
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
 *
 * @extract-docs
 * @menu-group Caching
 */
export default class ViewModelCache<T extends ViewModelInterface<any, any>> {
    cache: Map<PrimaryKeyCacheKey, RecordCache<T>>;
    viewModel: T['_model'];

    /**
     * @param viewModel The `ViewModel` this class is for
     */
    constructor(viewModel: T['_model']) {
        this.viewModel = viewModel;
        this.cache = new Map();
    }

    /**
     * Get the cache key to use into for the primary key. Handles compound keys.
     */
    private getPkCacheKey(pk: PrimaryKey): string | number {
        if (typeof pk === 'object') {
            const entries = Object.entries(pk);
            entries.sort(compareEntriesOnKey);
            return entries.reduce((acc, pair) => (acc += pair.join(CACHE_KEY_FIELD_SEPARATOR)), '');
        }
        return pk;
    }

    private isInstanceOfModel(a: any): a is T {
        return a instanceof this.viewModel;
    }

    /**
     * Add a record or records to the cache. Records are cached based on the fields that are
     * set on them (`record._assignedFields`).
     *
     * If record A has a superset of fields of record B then when A is cached it
     * will update the cache for record B. The reverse isn't true.
     *
     * @param recordOrData The record instance to cache. If a plain object is passed then
     * an instance of the view model will be created and returned. An array is also supported
     * in which case each entry in the array will be converted to the view model if required
     * and returned.
     */
    add(
        recordOrData:
            | T
            | FieldDataMappingRaw<T['__instanceFieldMappingType']>
            | (T | FieldDataMappingRaw<T['__instanceFieldMappingType']>)[]
    ): T | T[] {
        if (Array.isArray(recordOrData)) {
            return this.addList(recordOrData);
        }
        let record: T;
        if (!this.isInstanceOfModel(recordOrData)) {
            if (isViewModelInstance(recordOrData)) {
                throw new Error(
                    `Attempted to cache ViewModel of type ${recordOrData._model} in cache for ${this.viewModel}`
                );
            }
            record = new this.viewModel(recordOrData) as T;
        } else {
            record = recordOrData;
        }
        if (!record._assignedFields) {
            throw new Error('_assignedFields not set on record; cannot be cached');
        }
        const pkKey = this.getPkCacheKey(record._pk);
        let recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            recordCache = new RecordCache(this.viewModel, this.onAnyChange.bind(this));
            this.cache.set(pkKey, recordCache);
        }
        recordCache.add(record);
        return record;
    }

    isAddingList = false;
    onAddingListDone: (() => void)[] = [];

    /**
     * Add a list of records. Use this in place of manually calling
     * add() on each record individually so that listeners only get
     * notified once of the change to the list rather than for
     * each record in the list.
     */
    addList(records: (T | FieldDataMappingRaw<T['__instanceFieldMappingType']>)[]): T[] {
        this.isAddingList = true;
        try {
            const ret = records.map(record => this.add(record)) as T[];
            this.isAddingList = false;
            this.onAddingListDone.forEach(cb => cb());
            this.onAddingListDone = [];
            return ret;
        } catch (e) {
            this.onAddingListDone = [];
            this.isAddingList = false;
            throw e;
        }
    }

    /**
     * Get the currently cached version of the specified version
     *
     * @param record a current instance of a ViewModel to get the latest cached version of
     *
     * @returns The cached record or null if none found
     */
    get(record: T): T | null;
    /**
     * Get a record with the specified `fieldNames` set from the cache
     *
     * @param pk the primary key of the record to get
     * @param fieldNames the field names to use to look up the cache entry
     *
     * @returns The cached record or null if none found
     */
    get(pk: PrimaryKey, fieldNames: string[]): T | null;
    get(pkOrRecord: PrimaryKey | T, fieldNames?: string[]): T | null {
        let pk = pkOrRecord;
        if (isViewModelInstance(pk)) {
            const { _model } = pk;
            if (!this.isInstanceOfModel(pk)) {
                throw new Error(
                    `Attempted to get ViewModel of type ${_model} in cache for ${this.viewModel}`
                );
            }
            fieldNames = pk._assignedFields as string[];
            pk = pk._pk;
        }
        if (!fieldNames) {
            throw new Error('fieldNames must be provided');
        }
        if (!pk) {
            throw new Error('Primary key must be provided');
        }
        const { pkFieldName } = this.viewModel;
        const isCompound = Array.isArray(pkFieldName);
        // typescript failed to narrow pkFieldName to array using isCompound here
        // for some reason...
        if (Array.isArray(pkFieldName) && typeof pk !== 'object') {
            throw new Error(
                `${this.viewModel} has a compound key of ${pkFieldName.join(
                    ', '
                )}. You must provide an object mapping these fields to their values.`
            );
        } else if (Array.isArray(pkFieldName)) {
            const missingValues = pkFieldName.filter(name => pk[name] == null);
            if (missingValues.length > 0) {
                throw new Error(
                    `${this.viewModel} has a compound key of ${pkFieldName.join(
                        ', '
                    )}. Missing value(s) for field(s) ${missingValues.join(', ')}`
                );
            }
        } else if (!isCompound && typeof pk === 'object') {
            throw new Error(
                `${this.viewModel} has a single primary key named '${pkFieldName}' but an object was provided. This should be a number or string.`
            );
        }
        const pkKey = this.getPkCacheKey(pk);
        const recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            return null;
        }
        return recordCache.get(fieldNames);
    }

    /**
     * Get list of cached records from an existing list of records
     *
     * @param records List of existing ViewModel records to get latest cache version for
     * @param removeNulls whether to remove entries that have no record in the cache. Defaults to true.
     * @returns an array of the cached records. Any records not found will be in the array as a null value if `removeNulls` is false otherwise they will be removed.
     **/
    getList(records: T[], removeNulls?: boolean): (T | null)[];
    /**
     * Get a list of records with the specified `fieldNames` set from the cache
     *
     * Any record that is not found will end up in the array as a null value. If this
     * isn't desired you must filter them manually.
     *
     * @param pks An array of primary keys
     * @param fieldNames the field names to use to look up the cached entries
     * @param removeNulls whether to remove entries that have no record in the cache. Defaults to true.
     * @returns an array of the cached records. Any records not found will be in the array as a null value if `removeNulls` is false otherwise they will be removed.
     */
    getList(pks: PrimaryKey[], fieldNames: string[], removeNulls?: boolean): (T | null)[];
    getList(
        pksOrRecords: PrimaryKey[],
        fieldNames?: string[] | boolean,
        removeNulls = true
    ): (T | null)[] {
        if (pksOrRecords.length === 0) {
            return [];
        }
        let records: (T | null)[] = [];
        if (!Array.isArray(fieldNames)) {
            removeNulls = fieldNames == null ? true : fieldNames;
            records = pksOrRecords.map(record => this.get(record as T));
        } else {
            for (const pk of pksOrRecords) {
                records.push(this.get(pk, fieldNames));
            }
        }
        if (removeNulls) {
            return records.filter(Boolean);
        }
        return records;
    }

    _lastAllRecords: Map<string, T[]> = new Map();

    /**
     * Get all records in the cache for the specified field names. This acts like `getList` but returns
     * all records not just records with specified primary keys.
     *
     * This function guarantees to return the same array (ie. passes strict equality check) if the underlying
     * records have not changed.
     *
     * @param fieldNames List of field names to return records for
     */
    getAll(fieldNames: string[]): T[] {
        const records: T[] = [];
        let isSame = true;
        let index = 0;
        const key = getFieldNameCacheKey(fieldNames, this.viewModel.pkFieldNames);
        const lastRecords = this._lastAllRecords.get(key) || [];
        for (const cacheValue of this.cache.values()) {
            const record = cacheValue.get(fieldNames);
            if (record) {
                records.push(record);
                if (index > lastRecords.length - 1 || lastRecords[index] !== record) {
                    isSame = false;
                }
                index += 1;
            }
        }
        if (isSame) {
            return lastRecords;
        }
        this._lastAllRecords.set(key, records);
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
    delete(pk: PrimaryKey, fieldNames?: string[]): boolean {
        const pkKey = this.getPkCacheKey(pk);
        const recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            return false;
        }
        return recordCache.delete(fieldNames);
    }

    private notifyAnyChange = (): void => {
        this.allChangeListeners.forEach(cb => cb());
    };

    private onAnyChange(): void {
        if (this.isAddingList) {
            if (!this.onAddingListDone.includes(this.notifyAnyChange)) {
                this.onAddingListDone.push(this.notifyAnyChange);
            }
        } else {
            this.notifyAnyChange();
        }
    }

    allChangeListeners: (() => void)[] = [];

    /**
     * Add a listener to any changes at all. The detail of the changes are not available.
     *
     * @param listener Function to that is called when any change occurs. The function is called with no parameters.
     * @returns A function that removes the listener
     */
    addListener(listener: AllChangesListener): ChangeListenerUnsubscribe;
    /**
     * Add a listener for any changes, additions or deletions for the record(s) identified by
     * `pkOrPks` for the field names `fieldNames`.
     *
     * @param pkOrPks Primary key or array of multiple primary keys that identifies the record(s)
     * to listen to changes/additions/deletions to
     * @param fieldNames Field names to listen to changes/additions/deletions to
     * @param listener Function to call with any changes
     * @returns A function that removes the listener
     */
    addListener(
        pkOrPks: PrimaryKey | PrimaryKey[],
        fieldNames: string[],
        listener: MultiChangeListener<T> | ChangeListener<T>
    ): ChangeListenerUnsubscribe;
    addListener(
        pkOrPksOrListener: PrimaryKey | PrimaryKey[] | (() => void),
        fieldNames?: string[],
        listener?: MultiChangeListener<T> | ChangeListener<T>
    ): ChangeListenerUnsubscribe {
        if (typeof pkOrPksOrListener == 'function') {
            this.allChangeListeners.push(pkOrPksOrListener);
            return (): void => {
                const index = this.allChangeListeners.indexOf(pkOrPksOrListener);

                if (index !== -1) {
                    this.allChangeListeners.splice(index, 1);
                }
            };
        }
        if (!fieldNames) {
            throw new Error('If primary key(s) are specified fieldNames msut also be specified');
        }
        const pkOrPks: PrimaryKey | PrimaryKey[] = pkOrPksOrListener;
        if (Array.isArray(pkOrPks)) {
            return this.addListenerList(
                pkOrPks,
                fieldNames,
                // TODO: I couldn't work out how to type this otherwise. I tried
                // function overload but doesn't seem to be possible to narrow
                // to type of the function to differentiate between ChangeListener
                // and MultiChangeListener
                (listener as unknown) as MultiChangeListener<T>
            );
        }
        const pkKey = this.getPkCacheKey(pkOrPks);
        let recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            recordCache = new RecordCache(this.viewModel, this.onAnyChange.bind(this));
            this.cache.set(pkKey, recordCache);
        }
        return recordCache.addListener(fieldNames, (listener as unknown) as ChangeListener<T>);
    }

    addListenerList(
        pks: PrimaryKey[],
        fieldNames: string[],
        listener: MultiChangeListener<T>
    ): ChangeListenerUnsubscribe {
        let previous = pks.map(pk => this.get(pk, fieldNames));
        let onDoneCallback;
        const cb = (): void => {
            const next = pks.map(pk => this.get(pk, fieldNames));
            if (this.isAddingList) {
                // When we are adding a list of records we wait until it finishes before
                // notifying the listener. We need to cache the value of 'previous'
                // at the time the first change is detected and pass that through once
                // the list has been added.
                if (!this.onAddingListDone.includes(onDoneCallback)) {
                    const firstPrevious = previous;
                    onDoneCallback = (): void => {
                        listener(
                            firstPrevious,
                            pks.map(pk => this.get(pk, fieldNames))
                        );
                    };
                    this.onAddingListDone.push(onDoneCallback);
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
