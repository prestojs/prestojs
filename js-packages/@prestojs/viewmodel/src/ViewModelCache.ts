import { isEqual as isShallowEqual } from '@prestojs/util';
import pick from 'lodash/pick';
import { BaseRelatedViewModelField } from './fields/RelatedViewModelField';
import { isDev } from './util';
import {
    expandRelationFieldPaths,
    ExtractFieldNames,
    ExtractPkFieldParseableValueType,
    FieldDataMappingRaw,
    FieldPath,
    flattenFieldPath,
    getAssignedFieldsDeep,
    InvalidFieldError,
    isViewModelInstance,
    PartialViewModel,
    ViewModelConstructor,
    ViewModelInterface,
} from './ViewModelFactory';

// Controller for conditionally enabling listeners. We don't want to fire listeners anytime
// something changes in the cache as there's lots of changes that happen internally for keeping
// the cache in sync that aren't specifically a change consumers care about
let listenersEnabled = false;

/**
 * Any changes that occur within the passed function will trigger listeners
 */
function withEnableListeners<T>(run: () => T): T {
    if (listenersEnabled) {
        return run();
    }
    listenersEnabled = true;
    try {
        const r = run();
        listenersEnabled = false;
        return r;
    } catch (err) {
        listenersEnabled = false;
        throw err;
    }
}

/**
 * Points to a record that is cached already. The purpose of this is to have a single object
 * in memory and only clone it as needed (eg. a single instance of the RecordPointer is stored
 * on multiple other cache keys). We could do it by storing the record directly but we'd then
 * have to check if the _assignedFields is what we expect and then clone - it's easier and faster
 * to just check if it's an instanceof RecordPointer
 */
class RecordPointer<ViewModelClassType extends ViewModelConstructor<any, any>> {
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
    currentCachedRecord?: null | InstanceType<ViewModelClassType>;
    record: InstanceType<ViewModelClassType>;
    constructor(
        currentCachedValue:
            | null
            | undefined
            | InstanceType<ViewModelClassType>
            | RecordPointer<ViewModelClassType>,
        record: InstanceType<ViewModelClassType>
    ) {
        this.currentCachedRecord =
            currentCachedValue instanceof RecordPointer
                ? currentCachedValue.currentCachedRecord
                : currentCachedValue;
        this.record = record;
    }

    clone(
        fieldNames: readonly ExtractFieldNames<ViewModelClassType['fields']>[]
    ): PartialViewModel<ViewModelClassType, typeof fieldNames[number]>;
    clone(fieldNames: FieldPath<ViewModelClassType>[]): InstanceType<ViewModelClassType>;
    clone(
        fieldNames:
            | readonly ExtractFieldNames<ViewModelClassType['fields']>[]
            | FieldPath<ViewModelClassType>[]
    ): ViewModelInterface<any, any> {
        // First clone existing record as list of field names may be a subset. When we compare
        // values below we need to only compare the specified fields.
        const cloned = this.record.clone(fieldNames as FieldPath<ViewModelClassType>[]);
        // Check if the value has actually changed from what it used to be. If not we can return
        // the old value so that equality checks still hold.
        if (this.currentCachedRecord && cloned.isEqual(this.currentCachedRecord)) {
            return this.currentCachedRecord;
        }
        return cloned;
    }
}

function isEqual<T extends ViewModelConstructor<any, any>>(
    a: null | InstanceType<T> | RecordPointer<T>,
    b: null | InstanceType<T> | RecordPointer<T>
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

type ChangeListener<T> = (previous?: T | null, next?: T | null) => void;
type MultiChangeListener<T> = (previous?: (T | null)[], next?: (T | null)[]) => void;
type ChangeListenerUnsubscribe = () => void;
type AllChangesListener = () => void;

// Separator used to join multiple values when generating a string key, eg.
// ['a', 'b', 'c'] becomes 'a⁞b⁞c'
const CACHE_KEY_FIELD_SEPARATOR = '⁞';

/**
 * Must be kept in sync with `reverseCacheKey`
 */
function getFieldNameCacheKey<ViewModelClassType extends ViewModelConstructor<any, any>>(
    fieldNames: readonly FieldPath<ViewModelClassType>[],
    viewModel: ViewModelConstructor<any, any>
): string {
    const flatFieldNames = new Set<string>();
    for (const path of fieldNames as FieldPath<ViewModelClassType>[]) {
        if (typeof path === 'string') {
            // TODO: Why did I do this check? It means if you just fetch the id field the key will be empty string
            if (!viewModel.pkFieldNames.includes(path)) {
                flatFieldNames.add(path);
            }
        } else {
            // getField guarantees that the field will be a RelatedViewModelField so we
            // don't need to check it here
            const relatedField = viewModel.getField(
                // If the related field is empty (eg. ManyRelatedViewModelField with value []) then
                // the path will only have 1 element which is the related field itself.
                // For instance if we receive data like
                // {
                //     title: 'Main Record',
                //     foreignKeys: [{
                //         id: 1,
                //         name: 'Record Name',
                //     }]
                // }
                // Then `fieldNames` will be ['title', ['foreignKeys', 'name']] and so we need
                // to get rid of `name` to get the final related field. If we instead receive
                // {
                //     title: 'Main Record',
                //     foreignKeys: []
                // }
                // the value is set (it's just empty) and the `fieldNames` will be ['title', ['foreignKeys']]
                // and so the path is to the related field itself (because there's no subfields set because
                // it's null)
                path.length === 1 ? path : (path.slice(0, -1) as FieldPath<any>)
            ) as BaseRelatedViewModelField<any, any, any>;
            if (!relatedField.to.pkFieldNames.includes(path[path.length - 1])) {
                flatFieldNames.add(path.join('.'));
            }
        }
    }
    // primary key field names are implicit; never include them in the key itself
    const f = [...flatFieldNames];
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
class RecordCache<ViewModelClassType extends ViewModelConstructor<any, any>> {
    viewModel: ViewModelClassType;
    pkFieldNames: string[];
    cache: Map<
        FieldNameCacheKey,
        InstanceType<ViewModelClassType> | RecordPointer<ViewModelClassType> | null
    >;
    cacheListeners: Map<FieldNameCacheKey, ChangeListener<InstanceType<ViewModelClassType>>[]>;
    latestRecords: { [fieldsKey: string]: number };
    counter = 0;
    onAnyChange: () => void;
    recordPk: ExtractPkFieldParseableValueType<ViewModelClassType>;
    relationListeners: Map<string, Map<FieldNameCacheKey, ChangeListenerUnsubscribe>>;

    constructor(
        viewModel: ViewModelClassType,
        onAnyChange: () => void,
        pk: ExtractPkFieldParseableValueType<ViewModelClassType>
    ) {
        this.cache = new Map();
        this.cacheListeners = new Map();
        this.relationListeners = new Map();
        this.latestRecords = {};
        this.viewModel = viewModel;
        this.pkFieldNames = viewModel.pkFieldNames;
        this.onAnyChange = onAnyChange;
        this.recordPk = pk;
    }

    /**
     * Return the key to use into `cache` for the specified field names
     *
     * Must be kept in sync with `reverseCacheKey`
     */
    private getCacheKey(fieldNames: FieldPath<ViewModelClassType>[]): string {
        return getFieldNameCacheKey(fieldNames as FieldPath<ViewModelClassType>[], this.viewModel);
    }

    /**
     * Take a cache key generated with `getCacheKey` and return the list of fields
     *
     * Must be kept in sync with `getCacheKey`/`getFieldNameCacheKey`
     */
    private reverseCacheKey(fieldsKey: string): FieldPath<ViewModelClassType>[] {
        return fieldsKey.split(CACHE_KEY_FIELD_SEPARATOR).map(fieldName => {
            const parts = fieldName.split('.');
            if (parts.length === 1) {
                return parts[0];
            }
            return parts;
        }) as FieldPath<ViewModelClassType>[];
    }

    /**
     * Helper to return relations and non-relation fields
     *
     * The relations are returned as a mapping from relation field name to a list of fields for that
     * relation.
     *
     * Non-relations are returned as a list of non-relation fields. Note that this includes the id field
     * for any relations.
     *
     * @private
     */
    private getRelationFields(
        fieldNames: FieldPath<ViewModelClassType>[],
        viewModel = this.viewModel
    ): {
        relations: Record<string, FieldPath<ViewModelClassType>[]>;
        nonRelationFieldNames: string[];
    } {
        const relations: Record<string, FieldPath<ViewModelClassType>[]> = {};
        const nonRelationFieldNames: string[] = [];
        for (const fieldName of fieldNames as FieldPath<ViewModelClassType>[]) {
            if (Array.isArray(fieldName)) {
                relations[fieldName[0]] = relations[fieldName[0]] || [];
                if (fieldName.length === 2) {
                    relations[fieldName[0]].push(fieldName[1]);
                } else {
                    relations[fieldName[0]].push(
                        fieldName.slice(1) as FieldPath<ViewModelClassType>
                    );
                }
            } else if (viewModel.fields[fieldName] instanceof BaseRelatedViewModelField) {
                relations[fieldName] = relations[fieldName] || [];
                nonRelationFieldNames.push(viewModel.fields[fieldName].sourceFieldName);
            } else {
                if (!viewModel.pkFieldNames.includes(fieldName)) {
                    nonRelationFieldNames.push(fieldName);
                }
                // if (!viewModel.fields[fieldName]) {
                //     console.warn(
                //         `Unknown field ${fieldName}`
                //     );
                // }
            }
        }
        for (const [relationName, relationFieldNames] of Object.entries(relations)) {
            if (relationFieldNames.length === 0) {
                const relation = viewModel.fields[relationName];
                // If field names for relation haven't been specified default to all non-relation fields
                relationFieldNames.push(
                    ...relation.to.fieldNames.filter(fieldName => {
                        return !(
                            relation.to.fields[fieldName] instanceof BaseRelatedViewModelField
                        );
                    })
                );
            }
        }
        return { relations, nonRelationFieldNames };
    }

    /**
     * Set a value for the specified key notifying any listeners
     */
    private setValueForKey(
        key,
        value: InstanceType<ViewModelClassType> | RecordPointer<ViewModelClassType> | null
    ): Map<string, InstanceType<ViewModelClassType> | RecordPointer<ViewModelClassType>> | null {
        let before = this.cache.get(key) || null;
        let ret;
        const listeners = this.cacheListeners.get(key);
        if (listeners) {
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
                if (listenersEnabled) {
                    listeners.forEach(cb => cb(before as InstanceType<ViewModelClassType>, value));
                }
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
        this.onAnyChange();
        return ret;
    }

    /**
     * Adds a placeholder entry for `fieldNames` so that changes to that cache key are detected
     * (eg. when a superset of fields are changed).
     *
     * Changes to a subset of fields are detected by their existence in either the listener cache
     * or record cache. If a record is retrieved from the cache on field names that has no current
     * entry but there exists a record with the superset of fields then a new cache Record entry
     * is created at that point in time and returned immediately.
     *
     * This works fine in most cases however if there's a null RelatedField then keys corresponding
     * to fields nested via the FK won't yet exist in the cache and will not be updated. This is because
     * when the record is cached the keys are extracted from the assigned fields - but if the RelatedField
     * is null then the nested fields cannot be inferred and so the cache key will differ from the
     * requested key.
     *
     * As an example consider `cache.get(1, ['username', ['group', 'name']])`
     *  - Here there's a related field `group` which in turn has a related field `owner`.
     *  - The source field for `group` is `groupId` and is null.
     *  - The requested key does not exists we do have a superset of
     *    `['email', 'username', ['group', 'name']]`
     *  - `addKeyPlaceholder(['username', ['group', 'name']])` is called to ensure that there is
     *    guaranteed to be a cache entry for the requested key.
     *    - If there is no cache entry present it will set it to null.
     *  - We set the cache entry for `['username', ['group', 'name']])` to
     *    `{username: 'dev', groupId: null}`
     *  - The act of setting this cache entry also triggers an update on the `['username', 'groupId']`
     *    key which is identified as having a subset of fields
     *  - This ensure that updates to partial records involving both `group` and `groupId` are kept
     *    in sync
     */
    addKeyPlaceholder(fieldNames: FieldPath<ViewModelClassType>[]): void {
        fieldNames = expandRelationFieldPaths(
            this.viewModel,
            fieldNames as FieldPath<ViewModelClassType>[]
        );
        const fieldsKey = this.getCacheKey(fieldNames);
        if (!this.cache.has(fieldsKey)) {
            this.cache.set(fieldsKey, null);
        }
    }

    /**
     * Adds listeners to related fields so nested cache records can be updated when a nested
     * dependency changes.
     *
     * This has to occur whenever data is added to the cache that contains a nested record in
     * order for the record to be kept up to date.
     *
     * @private
     */
    private setupRelationListeners(record, fieldsKey): void {
        const assignedFieldNames = this.reverseCacheKey(fieldsKey);
        const { relations } = this.getRelationFields(assignedFieldNames);
        for (const [fieldName, relationFields] of Object.entries(relations)) {
            const relation = this.viewModel.fields[fieldName];
            const id = record[relation.sourceFieldName];
            let listenerMap = this.relationListeners.get(fieldName);
            if (!listenerMap) {
                listenerMap = new Map();
                this.relationListeners.set(fieldName, listenerMap);
            }
            const unsub = listenerMap.get(fieldsKey);
            unsub?.();
            if (id != null) {
                listenerMap.set(
                    fieldsKey,
                    relation.to.cache.addListener(
                        id,
                        relationFields,
                        (before, after) => {
                            let record = this.cache.get(fieldsKey);
                            if (record instanceof RecordPointer) {
                                record = record.clone(assignedFieldNames);
                            }
                            if (record) {
                                // If record was removed cleanup. For ManyRelatedViewModelField this will be an array of
                                // values - if any are null that means we no longer find the cached items and cleanup
                                if (!after || (Array.isArray(after) && after.includes(null))) {
                                    this.cleanupKey(fieldsKey);
                                } else if (!isShallowEqual(after, record[fieldName])) {
                                    const newRecord = new this.viewModel({
                                        ...record._data,
                                        [fieldName]: after,
                                    }) as InstanceType<ViewModelClassType>;
                                    this.setValueForKey(fieldsKey, newRecord);
                                }
                            }
                        },

                        false
                    )
                );
            }
        }
    }

    /**
     * Given an existing cached record `record`, a cache key `key` and the
     * fields `assignedFieldNames` on `record` create a new record for `key` if it is
     * a subset of `record`.
     * @private
     */
    private createRecordForSubKey(
        record: InstanceType<ViewModelClassType> | RecordPointer<ViewModelClassType>,
        key: FieldNameCacheKey,
        assignedFieldNames: FieldPath<ViewModelClassType>[]
    ): InstanceType<ViewModelClassType> | RecordPointer<ViewModelClassType> | null {
        const fieldNames = flattenFieldPath(assignedFieldNames);
        const cacheFieldNames = this.reverseCacheKey(key);
        const { nonRelationFieldNames: otherNonRelationFieldKeys } =
            this.getRelationFields(assignedFieldNames);
        const { relations, nonRelationFieldNames } = this.getRelationFields(cacheFieldNames);
        if (isSubset(flattenFieldPath(cacheFieldNames), fieldNames)) {
            if (record instanceof RecordPointer) {
                record = record.record;
            }
            return new RecordPointer(this.cache.get(key), record);
        }
        if (
            Object.keys(relations).length > 0 &&
            isSubset(nonRelationFieldNames, otherNonRelationFieldKeys)
        ) {
            if (record instanceof RecordPointer) {
                record = record.record;
            }
            const data = {};
            for (const [fieldName, relationFields] of Object.entries(relations)) {
                const relation = this.viewModel.fields[fieldName];
                if (record._assignedFields.includes(relation.sourceFieldName)) {
                    const id = record[relation.sourceFieldName];
                    if (id == null) {
                        data[fieldName] = null;
                        data[relation.sourceFieldName] = null;
                    } else {
                        let relationRecord = relation.many
                            ? relation.to.cache.getList(id, relationFields)
                            : relation.to.cache.get(id, relationFields);

                        if (
                            !relationRecord &&
                            record._assignedFields.includes(fieldName) &&
                            record[fieldName]
                        ) {
                            relation.to.cache.add(record[fieldName]);
                            relationRecord = relation.to.cache.get(id, relationFields);
                        }
                        // If we have multiple records but only some of them are found then ignore
                        // it entirely - we count it as not found
                        if (
                            relation.many &&
                            relationRecord &&
                            relationRecord.length !== id.length
                        ) {
                            relationRecord = null;
                        }
                        if (!relationRecord) {
                            return null;
                        }
                        data[fieldName] = relationRecord;
                    }
                } else {
                    return null;
                }
            }
            return new this.viewModel({
                ...pick(record._data, [...nonRelationFieldNames, ...record._model.pkFieldNames]),
                ...data,
            }) as InstanceType<ViewModelClassType>;
        }
        return null;
    }

    /**
     * Add a record to the cache based on the fields that are set on it.
     *
     * This will also update any cached entries for records that contain only
     * a subset of the fields set on `record. Note that this does not update
     * a superset of fields, ie. updating fields (a,b) won't update a record
     * that contains (a,b,c)
     */
    add(
        record: InstanceType<ViewModelClassType>
    ): Map<string, InstanceType<ViewModelClassType> | RecordPointer<ViewModelClassType>> | null {
        const assignedFieldNames = getAssignedFieldsDeep(record);
        const fieldsKey = this.getCacheKey(assignedFieldNames);
        for (const key of [...this.cache.keys(), ...this.cacheListeners.keys()]) {
            const newRecord = this.createRecordForSubKey(record, key, assignedFieldNames);
            if (newRecord) {
                this.setValueForKey(key, newRecord);
                this.setupRelationListeners(record, key);
            }
        }
        const ret = this.setValueForKey(fieldsKey, record);

        if (this.cache.has(fieldsKey)) {
            this.latestRecords[fieldsKey] = this.counter++;
        }

        // Update cache for any nested records
        for (const fieldName of record._assignedFields as string[]) {
            if (
                this.viewModel.fields[fieldName] instanceof BaseRelatedViewModelField &&
                record[fieldName]
            ) {
                if (this.viewModel.fields[fieldName].many) {
                    if (record[fieldName].length > 0) {
                        this.viewModel.fields[fieldName].to.cache.addList(record[fieldName]);
                    }
                } else {
                    this.viewModel.fields[fieldName].to.cache.add(record[fieldName]);
                }
            }
        }

        this.setupRelationListeners(record, fieldsKey);

        return ret;
    }

    /**
     * Get the cached record for the specified field names
     */
    get(fieldNames: FieldPath<ViewModelClassType>[]): InstanceType<ViewModelClassType> | null;
    get(
        fieldNames:
            | readonly ExtractFieldNames<ViewModelClassType['fields']>[]
            | FieldPath<ViewModelClassType>[]
    ): InstanceType<ViewModelClassType> | null {
        // Expand any related record paths so we cache on the actual field names. eg.
        // Imagine "group" is a RelatedViewModelField two fields, this gets expanded from
        //   ["name", "group"]
        // to
        //   ["name", "group.name", "group.isActive"]
        // So we always cache on the field names that will be returned. This simplifies
        // the implementation so don't need to worry about caching on explicit list of
        // all fields or the implicit version
        fieldNames = expandRelationFieldPaths(
            this.viewModel,
            fieldNames as FieldPath<ViewModelClassType>[]
        );
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
                        `Value for key ${key} is missing in cache but exists in latestRecords. This is a bug.`
                    );
                    continue;
                }
                const underlyingRecord = record instanceof RecordPointer ? record.record : record;
                if (
                    isSubset(
                        flattenFieldPath(fieldNames as FieldPath<ViewModelClassType>[]),
                        flattenFieldPath(getAssignedFieldsDeep(underlyingRecord))
                    )
                ) {
                    // Create a new record with subset of fields and cache
                    // it so that we maintain object equality if you fetch
                    // this entry from the cache multiple times
                    const newRecord = record.clone(fieldNames) as InstanceType<ViewModelClassType>;
                    this.setValueForKey(fieldsKey, newRecord);
                    this.setupRelationListeners(newRecord, fieldsKey);
                    return newRecord;
                }
            }
            return null;
        }
        const recordOrPointer = this.cache.get(fieldsKey);
        if (recordOrPointer instanceof RecordPointer) {
            // If a pointer to a record with a superset of fields exists then
            // clone that record with just the fields requested.
            const record = recordOrPointer.clone(fieldNames as FieldPath<ViewModelClassType>[]);
            this.setValueForKey(fieldsKey, record);
            this.setupRelationListeners(record, fieldsKey);
            // Refetch the record from the cache - setValueForKey has optimisations to avoid using a new
            // record if the existing record is equal so cachedRecord won't necessarily be the same as record.
            const cachedRecord = this.cache.get(fieldsKey);
            if (!cachedRecord || cachedRecord instanceof RecordPointer) {
                throw new Error(
                    `Expected record to be cached under key ${fieldsKey} but wasn't. This is a bug - please open an issue.`
                );
            }
            return cachedRecord;
        }
        if (recordOrPointer) {
            return recordOrPointer;
        }
        return null;
    }

    /**
     * Remove specified key from cache, cleanup any relation listeners and trigger
     * listener callbacks if required.
     * @private
     */
    private cleanupKey(fieldsKey): void {
        this.setValueForKey(fieldsKey, null);

        // Cleanup any relation listeners this entry had attached
        for (const p of this.reverseCacheKey(fieldsKey)) {
            if (Array.isArray(p)) {
                const r = this.relationListeners.get(p[0]);
                if (r?.has(fieldsKey)) {
                    r.delete(fieldsKey);
                }
            }
        }
        delete this.latestRecords[fieldsKey];
    }

    /**
     * Delete a record for the specified field names.
     *
     * Returns true if anything was deleted otherwise false
     */
    delete(
        fieldNames?:
            | readonly ExtractFieldNames<ViewModelClassType['fields']>[]
            | FieldPath<ViewModelClassType>[]
    ): boolean {
        if (!fieldNames) {
            for (const key of this.cache.keys()) {
                this.cleanupKey(key);
            }
            return true;
        }
        const fieldsKey = this.getCacheKey(
            expandRelationFieldPaths(this.viewModel, fieldNames as FieldPath<ViewModelClassType>[])
        );
        if (!this.cache.has(fieldsKey)) {
            return false;
        }
        this.cleanupKey(fieldsKey);
        return true;
    }

    /**
     * Add a listener for any changes, additions or deletions for the specified field names
     * @param fieldNames field names to listen to any changes for. See [Field notation](#Field_notation) for supported format.
     * @param listener Function to call with any changes
     */
    addListener(
        fieldNames: readonly ExtractFieldNames<ViewModelClassType['fields']>[],
        listener: ChangeListener<InstanceType<ViewModelClassType>>
    ): ChangeListenerUnsubscribe;
    addListener(
        fieldNames: FieldPath<ViewModelClassType>[],
        listener: ChangeListener<InstanceType<ViewModelClassType>>
    ): ChangeListenerUnsubscribe;
    addListener(
        fieldNames:
            | readonly ExtractFieldNames<ViewModelClassType['fields']>[]
            | FieldPath<ViewModelClassType>[],
        listener: ChangeListener<InstanceType<ViewModelClassType>>
    ): ChangeListenerUnsubscribe {
        const fieldsKey = this.getCacheKey(
            expandRelationFieldPaths(this.viewModel, fieldNames as FieldPath<ViewModelClassType>[])
        );
        if (!this.cache.has(fieldsKey)) {
            // This handles the case where a listener is added _after_ an item that
            // would match it's key is added. This is only necessary for the delete
            // case; without this a delete that occurs in this instance wouldn't be
            // picked up and the listener would not be called. See the test case
            // "deletes should still work if listener added after record created"
            for (const key of [...this.cache.keys(), ...this.cacheListeners.keys()]) {
                const record = this.cache.get(key);
                if (!record) {
                    continue;
                }
                const newRecord = this.createRecordForSubKey(
                    record,
                    fieldsKey,
                    this.reverseCacheKey(key)
                );
                if (newRecord) {
                    this.setValueForKey(fieldsKey, newRecord);
                    this.setupRelationListeners(record, fieldsKey);
                    break;
                }
            }
        }

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
 * Responsible for handling the batching of changes for the purposes of calling listeners
 */
const defaultListenerBatcher = {
    /**
     * Whether batch is in progress
     */
    isActive: false,
    /**
     * This is items that need to be notified only once per change in a batch
     */
    pending: new Map(),
    /**
     * This is items that don't need to respect batching rules. This is really for internal
     * use but is part of the public API. This exists as to make listeners work across
     * related fields we listen to changes on the related field cache
     */
    pendingNoBatch: new Map(),
    /**
     * This is for callbacks that only listen to all changes on a model (not specific records or fields)
     */
    pendingAll: new Set(),

    /**
     * Queue a call to a non-record/field specific listeners
     */
    callAll(listener: AllChangesListener): void {
        if (this.isActive) {
            this.pendingAll.add(listener);
        } else {
            listener();
        }
    },
    /**
     * Queue a call to a record/field specific listener
     *
     * If `shouldBatch` is false then there's no guarantees about the listener only being called
     * once.
     */
    call<T>(
        listener: ChangeListener<T>,
        before?: T | null,
        after?: T | null,
        shouldBatch = true
    ): void {
        if (this.isActive) {
            const p = shouldBatch ? this.pending : this.pendingNoBatch;
            let listenerPending = p.get(listener);
            if (!listenerPending) {
                p.set(listener, [before, after]);
            } else {
                listenerPending[1] = after;
            }
        } else {
            listener(before, after);
        }
    },
    /**
     * Start a batch. The passed function is called and any changes queued. Once function returns listeners
     * will be dispatched. The value returned from `run` will be returned.
     *
     * If any error occurs in `run` then no listeners will be called.
     *
     * If you nest batches then all listeners run at the end of the outer batch.
     */
    batch<T>(run: () => T): T {
        if (this.isActive) {
            return run();
        }
        this.isActive = true;
        try {
            const r = run();
            let pending = this.pendingNoBatch;
            while (pending.size > 0) {
                this.pendingNoBatch = new Map();
                pending.forEach(([before, after], cb) => cb(before, after));
                pending = this.pendingNoBatch;
            }
            this.pending.forEach(([before, after], cb) => cb(before, after));
            this.pending = new Map();
            this.pendingAll.forEach(cb => cb());
            this.pendingAll = new Set();
            this.isActive = false;
            return r;
        } catch (e) {
            this.isActive = false;
            this.pending = new Map();
            this.pendingNoBatch = new Map();
            this.pendingAll = new Set();
            throw e;
        }
    },
};

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
 * ## Field notation
 *
 * If a model has a [RelatedViewModelField](doc:RelatedViewModelField) the data for a related field
 * can be retrieved using array notation:
 *
 * ```js
 * // Fetch the 'name' field and the related 'group' record and its 'label' field
 * ['name', ['group', 'label']]
 * ```
 *
 * To fetch all fields from a relation you can just specify its name:
 *
 * ```js
 * ['name', 'group']
 * // This will be expanded to include all non-relation fields on the related ViewModel
 * ['name', ['group', 'label'], ['group', 'ownerId']]
 * ```
 *
 * **NOTE:** Using the shorthand for a relation won't include any nested relation
 *
 * Accessing deeply related records is supported:
 *
 * ```js
 * ['name', ['group', 'owner', 'name']]
 * ```
 *
 * You can combine the shorthand with array notation to get all fields and the specified deep relations:
 * ```js
 * ['name', 'group', ['group', 'owner', 'name']]
 * // Equivalent to:
 * ['name', ['group', 'label'], ['group', 'owner', 'name']]
 * ```
 *
 * **NOTE:** When accessing a relation its `sourceFieldName` is always included regardless
 * of whether you explicitly request it:
 *
 * ```js
 * User.cache.get(1, ['name', 'group']);
 * // {
 * //   id: 1,
 * //   name: 'Bob',
 * //   groupId: 1,
 * //   group: {
 * //      id: 1,
 * //      label: 'Staff',
 * //   }
 * // }
 * ```
 *
 * @extract-docs
 * @menu-group Caching
 */
export default class ViewModelCache<ViewModelClassType extends ViewModelConstructor<any, any>> {
    /**
     * @private
     */
    cache: Map<PrimaryKeyCacheKey, RecordCache<ViewModelClassType>>;
    /**
     * @private
     */
    viewModel: ViewModelClassType;
    static listenerBatcher = defaultListenerBatcher;

    /**
     * @param viewModel The `ViewModel` this class is for
     */
    constructor(viewModel: ViewModelClassType) {
        this.viewModel = viewModel;
        this.cache = new Map();
    }

    /**
     * Batch changes made within provided function. This guarantees that any changes made
     * will result in a single call for each relevant listener.
     *
     * ```js
     * User.cache.addListener(listenerAll);
     * User.cache.addListener(1, ['id', 'name'], listener);
     * User.cache.addListenerList([1, 2], ['id', 'name'], listenerList);
     * User.cache.batch(() => {
     *   // This value won't appear in changes at all as it's replaced 2 lines down
     *   User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
     *   User.cache.add({ id: 2, name: 'Sam', groupId: null });
     *   User.cache.add({ id: 1, name: 'Bobby', groupId: 1 });
     * });
     * // All listeners called once
     * ```
     * @param run
     */
    batch<T>(run: () => T): T {
        return this.cacheClass.listenerBatcher.batch(run);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    private get cacheClass() {
        return Object.getPrototypeOf(this).constructor;
    }

    /**
     * Get the cache key to use into for the primary key. Handles compound keys.
     */
    private getPkCacheKey(
        pk: ExtractPkFieldParseableValueType<ViewModelClassType>
    ): string | number {
        if (typeof pk === 'object') {
            const entries = Object.entries(pk);
            entries.sort(compareEntriesOnKey);
            return entries.reduce((acc, pair) => (acc += pair.join(CACHE_KEY_FIELD_SEPARATOR)), '');
        }
        return pk as string | number;
    }

    private isInstanceOfModel(a: any): a is InstanceType<ViewModelClassType> {
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
    add<T extends InstanceType<ViewModelClassType>>(recordOrData: T): T;
    add<T extends InstanceType<ViewModelClassType>>(recordOrData: T[]): T[];
    add<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        recordOrData: FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>
    ): PartialViewModel<ViewModelClassType, FieldNames>;
    add<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        recordOrData: FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>[]
    ): PartialViewModel<ViewModelClassType, FieldNames>[];
    add<
        T extends InstanceType<ViewModelClassType>,
        FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>
    >(
        recordOrData:
            | T
            | FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>
            | (T | FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>)[]
    ):
        | T
        | T[]
        | PartialViewModel<ViewModelClassType, FieldNames>
        | PartialViewModel<ViewModelClassType, FieldNames>[] {
        if (Array.isArray(recordOrData)) {
            return this.addList(recordOrData);
        }
        let record: InstanceType<ViewModelClassType>;
        if (!this.isInstanceOfModel(recordOrData)) {
            if (isViewModelInstance(recordOrData)) {
                let message = `Attempted to cache ViewModel of type ${recordOrData._model} in cache for ${this.viewModel}.`;
                if (isDev()) {
                    message +=
                        ' If you are using hot loading this can cause instanceof checks to fail when the class is recreated - if this is the case a hard refresh should resolve the issue.';
                }
                throw new Error(message);
            }
            record = new this.viewModel(recordOrData) as InstanceType<ViewModelClassType>;
        } else {
            record = recordOrData;
        }
        if (!record._assignedFields) {
            throw new Error('_assignedFields not set on record; cannot be cached');
        }
        const pkKey = this.getPkCacheKey(record._key);
        let recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            recordCache = new RecordCache(this.viewModel, this.onAnyChange.bind(this), record._key);
            this.cache.set(pkKey, recordCache);
        }
        // Reassign to const so typescript know won't change in closure below
        const _recordCache = recordCache;
        return withEnableListeners(() => {
            return this.cacheClass.listenerBatcher.batch(() => {
                _recordCache.add(record);
                return record;
            });
        });
    }

    /**
     * Add a list of records. Use this in place of manually calling
     * add() on each record individually so that listeners only get
     * notified once of the change to the list rather than for
     * each record in the list.
     */
    addList<T extends InstanceType<ViewModelClassType>>(records: T[]): T[];
    addList<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        records: FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>[]
    ): PartialViewModel<ViewModelClassType, FieldNames>[];
    addList<
        T extends InstanceType<ViewModelClassType>,
        FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>
    >(
        records: (T | FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>)[]
    ): (T | PartialViewModel<ViewModelClassType, FieldNames>)[] {
        return withEnableListeners(() => {
            return this.cacheClass.listenerBatcher.batch(() => {
                return records.map(record =>
                    this.add(record)
                ) as InstanceType<ViewModelClassType>[];
            });
        });
    }

    /**
     * Resolves '*' to all fields and validates passed fields are all valid
     */
    private resolveFieldNames<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        fieldNames: readonly FieldNames[] | FieldPath<ViewModelClassType>[] | '*'
    ): readonly FieldNames[] | FieldPath<ViewModelClassType>[] {
        if (fieldNames === '*') {
            return this.viewModel.fieldNames as FieldNames[];
        }
        const fieldErrors = (fieldNames as FieldPath<ViewModelClassType>[])
            .map(fieldName => {
                try {
                    this.viewModel.getField(fieldName);
                    return false;
                } catch (err) {
                    if (err instanceof InvalidFieldError) {
                        return err.message;
                    }
                    throw err;
                }
            })
            .filter(Boolean);
        if (fieldErrors.length > 0) {
            throw new Error(`Invalid field(s) provided: ${fieldErrors.join(', ')}`);
        }
        return fieldNames;
    }

    /**
     * Get the currently cached version of the specified version
     *
     * @param record a current instance of a ViewModel to get the latest cached version of
     *
     * @returns The cached record or null if none found
     */
    get<T extends InstanceType<ViewModelClassType>>(record: T): T | null;
    /**
     * Get a record with the specified `fieldNames` set from the cache
     *
     * @param pk the primary key of the record to get
     * @param fieldNames the field names to use to look up the cache entry. Use '*' to indicate all fields.
     * See [Field notation](#Field_notation) for supported format.
     *
     * @returns The cached record or null if none found
     */
    get<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        pk: ExtractPkFieldParseableValueType<ViewModelClassType>,
        fieldNames: readonly FieldNames[] | '*'
    ): PartialViewModel<ViewModelClassType, FieldNames> | null;
    get(
        pk: ExtractPkFieldParseableValueType<ViewModelClassType>,
        fieldNames: FieldPath<ViewModelClassType>[]
    ): InstanceType<ViewModelClassType> | null;
    get<
        FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>,
        T extends InstanceType<ViewModelClassType>
    >(
        pkOrRecord: ExtractPkFieldParseableValueType<ViewModelClassType> | T,
        fieldNames?: readonly FieldNames[] | FieldPath<ViewModelClassType>[] | '*'
    ): T | null {
        let pk = pkOrRecord;
        if (isViewModelInstance(pk)) {
            const { _model } = pk;
            if (!this.isInstanceOfModel(pk)) {
                throw new Error(
                    `Attempted to get ViewModel of type ${_model} in cache for ${this.viewModel}.${
                        isDev()
                            ? ' If you are using hot loading this can cause instanceof checks to fail when the class is recreated - if this is the case a hard refresh should resolve the issue.'
                            : ''
                    }`
                );
            }
            fieldNames = getAssignedFieldsDeep(pk) as FieldNames[];
            pk = pk._key;
        }
        if (!fieldNames) {
            throw new Error('fieldNames must be provided');
        }
        if (pk == null) {
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

        fieldNames = this.resolveFieldNames(fieldNames);

        const pkKey = this.getPkCacheKey(pk);
        const recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            return null;
        }
        // If record exists under fieldNames key already then return it
        let record = recordCache.get(fieldNames as FieldPath<ViewModelClassType>[]);
        if (record) {
            return record as T;
        }
        const relations: BaseRelatedViewModelField<any, any, any>[] = [];
        const sourceFieldNames: FieldNames[] = [];
        const nestedFields: Record<string, FieldPath<ViewModelClassType>[]> = {};
        for (const pathElement of fieldNames) {
            const fieldName: string = Array.isArray(pathElement)
                ? pathElement[0]
                : (pathElement as string);
            const field = this.viewModel.fields[fieldName];
            if (Array.isArray(pathElement)) {
                const [name, ...p] = pathElement;
                if (!nestedFields[name]) {
                    nestedFields[name] = [];
                }
                if (p.length > 1) {
                    // Nested fields - need to pass the whole array
                    // eg. [user, group, id]
                    nestedFields[name].push(p as FieldPath<ViewModelClassType>);
                } else {
                    // A specific field on this record
                    // eg. [user, name]
                    nestedFields[name].push(p[0]);
                }
            }
            let sourceFieldName = fieldName as FieldNames;
            if (field instanceof BaseRelatedViewModelField) {
                sourceFieldName = field.sourceFieldName as FieldNames;
                if (!relations.includes(field)) {
                    relations.push(field);
                }
                if (!Array.isArray(pathElement)) {
                    if (!nestedFields[fieldName]) {
                        nestedFields[fieldName] = [];
                    }
                    nestedFields[fieldName].push(
                        ...field.to.fieldNames.filter(
                            f =>
                                !(field.to.fields[f] instanceof BaseRelatedViewModelField) &&
                                !nestedFields[fieldName].includes(f)
                        )
                    );
                }
            }
            if (!sourceFieldNames.includes(sourceFieldName)) {
                sourceFieldNames.push(sourceFieldName);
            }
        }
        // Otherwise retrieve it without the related field names (ie. just look it
        // up with the non-related field names + corresponding id's for related fields)
        record = recordCache.get(sourceFieldNames);
        // If record exists with the related field ids then attempt to resolve the
        // related record
        if (record && relations.length > 0) {
            let cacheFieldNames: FieldPath<ViewModelClassType>[] =
                fieldNames as FieldPath<ViewModelClassType>[];
            // For each request relation the corresponding record will be populated in this
            // object. If any of the requested relations don't exist in the cache then it's
            // considered a miss and `null` will be returned.
            const relationData = {};
            for (const relation of relations) {
                // Use specified fields or if not specified default to non-related fields. This
                // could default to '*' but it's much more difficult to handle circular references.
                // This way if you want related records you have to be explicit.
                const relatedFieldNames =
                    nestedFields[relation.name] ||
                    relation.to.fieldNames.filter(fieldName => {
                        return !(
                            relation.to.fields[fieldName] instanceof BaseRelatedViewModelField
                        );
                    });
                // TODO: This block seems to be unnecessary as it seems like it's always set above (no test case tests this)
                if (!nestedFields[relation.name]) {
                    const index = cacheFieldNames.indexOf(
                        relation.name as FieldPath<ViewModelClassType>
                    );
                    cacheFieldNames.splice(
                        index,
                        1,
                        ...(relatedFieldNames.map(f => [
                            relation.name,
                            f,
                        ]) as FieldPath<ViewModelClassType>)
                    );
                }
                if (record[relation.sourceFieldName] == null) {
                    relationData[relation.name] = null;
                    continue;
                }
                let relatedRecord;
                if (relation.many) {
                    relatedRecord = relation.to.cache.getList(
                        record[relation.sourceFieldName],
                        relatedFieldNames
                    );
                    if (
                        relatedRecord &&
                        relatedRecord.length !== record[relation.sourceFieldName].length
                    ) {
                        relatedRecord = null;
                    }
                } else {
                    relatedRecord = relation.to.cache.get(
                        record[relation.sourceFieldName],
                        relatedFieldNames
                    );
                }
                // We had an id but the underlying record isn't available
                if (!relatedRecord) {
                    return null;
                }
                relationData[relation.name] = relatedRecord;
            }
            if (Object.keys(relationData).length > 0) {
                // This could exist as cachedFieldNames can be changed above - if so we can return the
                // record now otherwise we must create a new cache entry for the record with resolved
                // relations.
                let cachedRecord = recordCache.get(
                    cacheFieldNames as FieldPath<ViewModelClassType>[]
                );
                if (cachedRecord) {
                    return cachedRecord as T;
                }
                // Add a null entry for these fields. This handles the case when nested data is fetched
                // but some part of the hierarchy is null (eg. the value is legitimately optional) -
                // in those cases the record should be returned.
                const newRecord = new this.viewModel({ ...record._data, ...relationData });

                recordCache.addKeyPlaceholder(cacheFieldNames);
                recordCache.add(newRecord as InstanceType<ViewModelClassType>);

                // We can now return the underlying record for the cache key requested (ie. the original
                // related field name rather than the source field name). It would work without this but
                // this ensures that it's the same object if you were to fetch the cached record again.
                cachedRecord = recordCache.get(cacheFieldNames as FieldPath<ViewModelClassType>[]);

                // If record isn't found there's something wrong with how keys are generated and it's
                // certainly an internal bug
                if (!cachedRecord) {
                    throw new Error(
                        'Record should be cached but is not; this is unexpected and a bug - please raise an issue'
                    );
                }
                return cachedRecord as T;
            }
        }
        return record as T | null;
    }

    /**
     * Get list of cached records from an existing list of records
     *
     * @param records List of existing ViewModel records to get latest cache version for
     * @param removeNulls whether to remove entries that have no record in the cache. Defaults to true.
     * @returns an array of the cached records. Any records not found will be in the array as a null value if `removeNulls` is false otherwise they will be removed.
     **/
    getList<T extends InstanceType<ViewModelClassType>>(records: T[], removeNulls: true): T[];
    getList<T extends InstanceType<ViewModelClassType>>(
        records: T[],
        removeNulls?: false
    ): (T | null)[];
    /**
     * Get a list of records with the specified `fieldNames` set from the cache
     *
     * Any record that is not found will end up in the array as a null value. If this
     * isn't desired you must filter them manually.
     *
     * @param pks An array of primary keys
     * @param fieldNames the field names to use to look up the cached entries. See [Field notation](#Field_notation) for supported format.
     * @param removeNulls whether to remove entries that have no record in the cache. Defaults to true.
     * @returns an array of the cached records. Any records not found will be in the array as a null value if `removeNulls` is false otherwise they will be removed.
     */
    getList<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: readonly FieldNames[] | '*',
        removeNulls?: boolean
    ): (PartialViewModel<ViewModelClassType, FieldNames> | null)[];
    getList(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: readonly FieldPath<ViewModelClassType>[]
    ): (InstanceType<ViewModelClassType> | null)[];
    getList<
        FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>,
        T extends InstanceType<ViewModelClassType>
    >(
        pksOrRecords: (T | ExtractPkFieldParseableValueType<ViewModelClassType>)[],
        fieldNames?:
            | readonly FieldNames[]
            | boolean
            | readonly FieldPath<ViewModelClassType>[]
            | '*',
        removeNulls = true
    ): (T | null)[] {
        if (pksOrRecords.length === 0) {
            return [];
        }
        let records: (InstanceType<ViewModelClassType> | null)[] = [];
        if (!fieldNames || fieldNames === true) {
            removeNulls = fieldNames == null ? true : fieldNames;
            records = (pksOrRecords as T[]).map(record => this.get(record));
        } else {
            for (const pk of pksOrRecords) {
                records.push(this.get(pk, fieldNames as FieldPath<ViewModelClassType>[]));
            }
        }
        if (removeNulls) {
            return records.filter(Boolean) as T[];
        }
        return records as (T | null)[];
    }

    /**
     * @private
     */
    _lastAllRecords: Map<string, PartialViewModel<ViewModelClassType, any>[]> = new Map();

    /**
     * Get all records in the cache for the specified field names. This acts like `getList` but returns
     * all records not just records with specified primary keys.
     *
     * This function guarantees to return the same array (ie. passes strict equality check) if the underlying
     * records have not changed.
     *
     * @param fieldNames List of field names to return records for. See [Field notation](#Field_notation) for supported format.
     */
    getAll<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        fieldNames: readonly FieldNames[] | '*'
    ): PartialViewModel<ViewModelClassType, FieldNames>[];
    getAll(fieldNames: FieldPath<ViewModelClassType>[]): InstanceType<ViewModelClassType>[];
    getAll<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        fieldNames: readonly FieldNames[] | FieldPath<ViewModelClassType>[] | '*'
    ): PartialViewModel<ViewModelClassType, FieldNames>[] {
        fieldNames = this.resolveFieldNames(fieldNames);
        const records: PartialViewModel<ViewModelClassType, FieldNames>[] = [];
        let index = 0;
        const key = getFieldNameCacheKey(fieldNames as readonly string[], this.viewModel);
        const lastRecords = (this._lastAllRecords.get(key) || []) as PartialViewModel<
            ViewModelClassType,
            FieldNames
        >[];
        // Tracks if records have changed from what is stored in `lastRecords`
        let isRecordsSame = true;
        for (const recordCache of this.cache.values()) {
            const pk = recordCache.recordPk;
            const record = this.get(pk, fieldNames as FieldNames[]);
            if (record) {
                records.push(record);
                if (index > lastRecords.length - 1 || lastRecords[index] !== record) {
                    isRecordsSame = false;
                }
                index += 1;
            }
        }
        // we need to also check the size because if the last record was removed then no
        // comparison of that record will have taken place so isRecordsSame will still be true
        if (isRecordsSame && lastRecords.length === records.length) {
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
     * this is not set then all data for the record is removed. See [Field notation](#Field_notation) for supported format.
     *
     * @returns true if anything was removed, false otherwise
     */
    delete(
        pk: ExtractPkFieldParseableValueType<ViewModelClassType>,
        fieldNames?:
            | readonly ExtractFieldNames<ViewModelClassType['fields']>[]
            | FieldPath<ViewModelClassType>[]
    ): boolean {
        const pkKey = this.getPkCacheKey(pk);
        const recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            return false;
        }
        return withEnableListeners(() => this.batch(() => recordCache.delete(fieldNames)));
    }

    private notifyAnyChange = (): void => {
        this.allChangeListeners.forEach(cb => cb());
    };

    private onAnyChange(): void {
        this.notifyAnyChange();
    }

    /**
     * @private
     */
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
     * @param fieldNames Field names to listen to changes/additions/deletions to. See [Field notation](#Field_notation) for supported format.
     * @param listener Function to call with any changes
     * @param batch Whether or not to batch this call with other calls (defaults to true). You shouldn't need to change the default.
     * @returns A function that removes the listener
     */
    addListener<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        pkOrPks: ExtractPkFieldParseableValueType<ViewModelClassType>,
        fieldNames: FieldNames[],
        listener: ChangeListener<PartialViewModel<ViewModelClassType, FieldNames>>,
        batch?: boolean
    ): ChangeListenerUnsubscribe;
    addListener<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        pkOrPks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: FieldNames[],
        listener: MultiChangeListener<PartialViewModel<ViewModelClassType, FieldNames>>,
        batch?: boolean
    ): ChangeListenerUnsubscribe;
    addListener(
        pkOrPks: ExtractPkFieldParseableValueType<ViewModelClassType>,
        fieldNames: FieldPath<ViewModelClassType>[],
        listener: ChangeListener<InstanceType<ViewModelClassType>>,
        batch?: boolean
    ): ChangeListenerUnsubscribe;
    addListener(
        pkOrPks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: FieldPath<ViewModelClassType>[],
        listener: MultiChangeListener<InstanceType<ViewModelClassType>>,
        batch?: boolean
    ): ChangeListenerUnsubscribe;
    addListener<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        pkOrPksOrListener:
            | ExtractPkFieldParseableValueType<ViewModelClassType>
            | ExtractPkFieldParseableValueType<ViewModelClassType>[]
            | (() => void),
        fieldNames?: FieldNames[] | FieldPath<ViewModelClassType>[],
        listener?:
            | MultiChangeListener<
                  | PartialViewModel<ViewModelClassType, FieldNames>
                  | InstanceType<ViewModelClassType>
              >
            | ChangeListener<
                  | PartialViewModel<ViewModelClassType, FieldNames>
                  | InstanceType<ViewModelClassType>
              >,
        batch = true
    ): ChangeListenerUnsubscribe {
        if (typeof pkOrPksOrListener == 'function') {
            const listener = (): void => this.cacheClass.listenerBatcher.callAll(pkOrPksOrListener);
            this.allChangeListeners.push(listener);
            return (): void => {
                const index = this.allChangeListeners.indexOf(listener);

                if (index !== -1) {
                    this.allChangeListeners.splice(index, 1);
                }
            };
        }
        if (!fieldNames) {
            throw new Error('If primary key(s) are specified fieldNames must also be specified');
        }
        if (!listener) {
            throw new Error('Listener function must be provided');
        }
        const pkOrPks:
            | ExtractPkFieldParseableValueType<ViewModelClassType>
            | ExtractPkFieldParseableValueType<ViewModelClassType>[] = pkOrPksOrListener;
        if (Array.isArray(pkOrPks)) {
            return this.addListenerList(
                pkOrPks,
                fieldNames as FieldPath<ViewModelClassType>[],
                // TODO: I couldn't work out how to type this otherwise. I tried
                // function overload but doesn't seem to be possible to narrow
                // to type of the function to differentiate between ChangeListener
                // and MultiChangeListener
                listener as MultiChangeListener<
                    | PartialViewModel<ViewModelClassType, FieldNames>
                    | InstanceType<ViewModelClassType>
                >
            );
        }
        const pkKey = this.getPkCacheKey(pkOrPks);
        let recordCache = this.cache.get(pkKey);
        if (!recordCache) {
            recordCache = new RecordCache(this.viewModel, this.onAnyChange.bind(this), pkOrPks);
            this.cache.set(pkKey, recordCache);
        }
        return recordCache.addListener(
            fieldNames as FieldPath<ViewModelClassType>[],
            (before, after) => {
                this.cacheClass.listenerBatcher.call(
                    listener as ChangeListener<
                        | PartialViewModel<ViewModelClassType, FieldNames>
                        | InstanceType<ViewModelClassType>
                    >,
                    before,
                    after,
                    batch
                );
            }
        );
    }

    addListenerList<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: FieldNames[],
        listener: MultiChangeListener<PartialViewModel<ViewModelClassType, FieldNames>>
    ): ChangeListenerUnsubscribe;
    addListenerList(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: FieldPath<ViewModelClassType>[],
        listener: MultiChangeListener<InstanceType<ViewModelClassType>>
    ): ChangeListenerUnsubscribe;
    addListenerList<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: FieldNames[] | FieldPath<ViewModelClassType>[],
        listener:
            | MultiChangeListener<InstanceType<ViewModelClassType>>
            | MultiChangeListener<PartialViewModel<ViewModelClassType, FieldNames>>
    ): ChangeListenerUnsubscribe {
        let previous = pks.map(pk => this.get(pk, fieldNames as FieldPath<ViewModelClassType>[]));
        const cb = (): void => {
            const next = pks.map(pk => this.get(pk, fieldNames as FieldPath<ViewModelClassType>[]));
            this.cacheClass.listenerBatcher.call(listener, previous, next);
            previous = [...next];
        };
        const unsubscribes = pks.map(pk =>
            this.addListener(pk, fieldNames as FieldPath<ViewModelClassType>[], () => {
                cb();
            })
        );

        return (): void => {
            unsubscribes.forEach(cb => cb());
        };
    }
}
