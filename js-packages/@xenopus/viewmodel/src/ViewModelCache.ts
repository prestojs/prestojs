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
    latestRecords: { [fieldsKey: string]: number };
    counter = 0;

    constructor() {
        this.cache = new Map();
        this.latestRecords = {};
    }

    /**
     * Return the key to use into `cache` for the specified field names
     */
    private getCacheKey(fieldNames: string[]): string {
        const f = [...fieldNames];
        f.sort();
        return f.join('⁞');
    }

    /**
     * Add a record to the cache based on the fields that are set on it.
     *
     * This will also update any cached entries for records that contain only
     * a subset of the fields set on `record.
     */
    add(record: T): Map<string, T | RecordPointer<T>> {
        const fieldNames = record._assignedFields;
        const fieldsKey = this.getCacheKey(fieldNames);
        this.latestRecords[fieldsKey] = this.counter++;
        const pointer = new RecordPointer(record);
        for (const [key, r] of this.cache.entries()) {
            const f = r instanceof RecordPointer ? r.record._assignedFields : r._assignedFields;
            if (isSubset(f, fieldNames)) {
                this.cache.set(key, pointer);
            }
        }
        return this.cache.set(fieldsKey, record);
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
                if (record instanceof RecordPointer) {
                    record = record.record;
                }
                if (isSubset(fieldNames, record._assignedFields)) {
                    // Create a new record with subset of fields and cache
                    // it so that we maintain object equality if you fetch
                    // this entry from the cache multiple times
                    const newRecord = record.clone(fieldNames);
                    this.cache.set(fieldsKey, newRecord);
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
            this.cache.set(fieldsKey, record);
            return record;
        }
        return recordOrPointer;
    }

    /**
     * Delete a record for the specified field names.
     *
     * Returns true if anything was deleted otherwise false
     */
    delete(fieldNames: string[]): boolean {
        const fieldsKey = this.getCacheKey(fieldNames);
        if (!this.cache.has(fieldsKey)) {
            return false;
        }
        this.cache.delete(fieldsKey);
        delete this.latestRecords[fieldsKey];
        return true;
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
            return pk.join('⁞');
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
        if (!this.cache.has(pkKey)) {
            this.cache.set(pkKey, new RecordCache());
        }
        const recordCache = this.cache.get(pkKey);
        recordCache.add(record);
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
        if (!this.cache.has(pkKey)) {
            return null;
        }
        const recordCache = this.cache.get(pkKey);
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
    getList(pks: (PrimaryKey | CompoundPrimaryKey)[], fieldNames: string[]): T[] {
        const records = [];
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
        if (!this.cache.has(pkKey)) {
            return false;
        }
        if (!fieldNames) {
            this.cache.delete(pkKey);
            return true;
        }
        const recordCache = this.cache.get(pkKey);
        return recordCache.delete(fieldNames);
    }
}
