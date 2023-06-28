import { isEqual as isShallowEqual } from '@prestojs/util';
import pick from 'lodash/pick';
import { BaseRelatedViewModelField } from './fields/RelatedViewModelField';
import { CACHE_KEY_FIELD_SEPARATOR, normalizeFields, ViewModelFieldPaths } from './fieldUtils';
import { isDev } from './util';
import {
    ExtractFieldNames,
    ExtractPkFieldParseableValueType,
    ExtractStarFieldNames,
    FieldDataMappingRaw,
    FieldPath,
    FieldPaths,
    isViewModelInstance,
    PartialViewModel,
    ViewModelConstructor,
    ViewModelInterface,
} from './ViewModelFactory';

type ChangeListener<T> = (previous?: T | null, next?: T | null) => void;
type MultiChangeListener<T> = (previous?: (T | null)[], next?: (T | null)[]) => void;
type ChangeListenerUnsubscribe = () => void;
type AllChangesListener = () => void;

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
 * Caches record instances based on the assigned fields
 */
class RecordFieldNameCache<ViewModelClassType extends ViewModelConstructor<any, any>> {
    /**
     * This stores the record instances by the field paths that are used to retrieve them
     */
    cache: Map<
        ViewModelFieldPaths<ViewModelClassType>,
        PartialViewModel<ViewModelClassType> | null
    >;
    /**
     * This stores the current listeners by the field paths
     */
    cacheListeners: Map<
        ViewModelFieldPaths<ViewModelClassType>,
        ChangeListener<PartialViewModel<ViewModelClassType>>[]
    >;
    /**
     * When a record has relation fields a listener is added to listen for changes on the related
     * records. When it receives notifications for those related records it can then in turn notify
     * the listeners on the original record.
     *
     * This map stores these listeners.
     */
    relationListenerUnsubscribe: Map<
        ViewModelFieldPaths<ViewModelClassType>,
        ChangeListenerUnsubscribe[]
    >;
    /**
     * The PK this cache is for
     */
    recordPk: ExtractPkFieldParseableValueType<ViewModelClassType>;
    viewModel: ViewModelClassType;
    onAnyChange: () => void;
    /**
     * Contains all keys in `cache` in descending order of last insert/update
     *
     * This is used to choose the most recent record when a new record with a subset
     * of the fields needs to be created. For example if there are 2 existing records
     * created in this order:
     *
     * ```
     * { id: 1, firstName: 'Jon', lastName: 'Doe', email: 'jon@doe.com' }
     * { id: 1, firstName: 'John', lastName: 'Doe' }
     * ```
     *
     * But a record is requested for just 'firstName' we need to create a new record
     * with just that field. We could create it from either of the existing records
     * but we want to use the _last_ record inserted - so in this case it would be:
     *
     * ```
     * { id: 1, firstName: 'John' }
     * ```
     */
    private lastUpdatedKeys: ViewModelFieldPaths<ViewModelClassType>[] = [];

    constructor(
        viewModel: ViewModelClassType,
        pk: ExtractPkFieldParseableValueType<ViewModelClassType>,
        onAnyChange: () => void
    ) {
        this.cacheListeners = new Map();
        this.relationListenerUnsubscribe = new Map();
        this.viewModel = viewModel;
        this.cache = new Map();
        this.recordPk = pk;
        this.onAnyChange = onAnyChange;
    }

    /**
     * Set a value for the specified `key`, then notify any listeners
     *
     * `lastUpdatedKeys` is always updated even if the value being set is identical.
     */
    private setValueForKey(
        key: ViewModelFieldPaths<ViewModelClassType>,
        value: PartialViewModel<ViewModelClassType> | null
    ): void {
        const index = this.lastUpdatedKeys.indexOf(key);
        if (index !== -1) {
            this.lastUpdatedKeys.splice(index, 1);
        }
        if (value) {
            this.lastUpdatedKeys.unshift(key);
        }
        let before = this.cache.get(key) || null;
        if (before === value) {
            return;
        }
        if (isShallowEqual(before, value)) {
            return;
        }
        this.cache.set(key, value);

        const listeners = this.cacheListeners.get(key);
        if (listeners && listeners.length > 0 && listenersEnabled) {
            listeners.forEach(cb => cb(before, value));
        }
        if (listenersEnabled) {
            this.onAnyChange();
        }
    }

    /**
     * Add a record to the cache based on the fields that are set on it.
     *
     * This will also update any cached entries for records that contain only
     * a subset of the fields set on `record`. Note that this does not update
     * a superset of fields, ie. updating fields (a,b) won't update a record
     * that contains (a,b,c)
     */
    add(record: PartialViewModel<ViewModelClassType>): void {
        // If record contains related records we have to populate the related caches as well
        for (const relationFieldName in record._assignedFieldPaths.relations) {
            const relation = this.viewModel.getField(
                relationFieldName
            ) as BaseRelatedViewModelField<any, any, any>;
            const relationData = record[relationFieldName];
            if (relationData && (!Array.isArray(relationData) || relationData.length > 0)) {
                relation.cache.add(relationData);
            }
        }

        for (const cacheKey of new Set([...this.cache.keys(), ...this.cacheListeners.keys()])) {
            // Check if subset but don't worry about nested fields (second argument). Nested fields are
            // handled in `constructWithRelatedRecords`. This makes it so a key that contains nested
            // fields will work even if a record with only the id for that relation is set so long as
            // the nested values already exist in the related record cache.
            // See the 'should handle nested related when related id is updated' test case for example.
            if (record._assignedFieldPaths.isSubset(cacheKey as ViewModelFieldPaths<any>, true)) {
                const recordWithRelations = this.constructWithRelatedRecords(cacheKey, record);
                if (recordWithRelations) {
                    this.setValueForKey(cacheKey, recordWithRelations);
                }
            }
        }
        const key =
            record._assignedFieldPaths as unknown as ViewModelFieldPaths<ViewModelClassType>;
        this.setValueForKey(key, record);

        if (record) {
            this.setupRelationListeners(key, record);
        }
    }

    /**
     * Get a record for the specified key. If the record doesn't yet exist but can be created from
     * another record in the cache (ie. one with a superset of the fields set) then this will be done
     * automatically.
     */
    get(key: ViewModelFieldPaths<ViewModelClassType>): PartialViewModel<ViewModelClassType> | null {
        const record = this.cache.get(key);
        if (record) {
            return record;
        }
        // record doesn't already exist for key - see if it's a subkey of existing entries
        for (const cacheKey of this.lastUpdatedKeys) {
            const record = this.cache.get(cacheKey);
            if (record && cacheKey.isSubset(key, true)) {
                // Resolve any relations which involves traversing the relevant cache for those fields
                let relationsMissing = false;
                const data = key.nonRelationFieldNames.reduce((acc, path) => {
                    acc[path] = record[path];
                    return acc;
                }, {});
                for (const [relationFieldName, relationFieldPaths] of Object.entries(
                    key.relations
                )) {
                    const relationField = this.viewModel.getField(
                        relationFieldName
                    ) as BaseRelatedViewModelField<any, any, any>;
                    const idOrIds = record[relationField.sourceFieldName];
                    // If the id is null (or empty array for many-to-many) then there is nothing to resolve - set to null/[]
                    if (idOrIds == null || (Array.isArray(idOrIds) && idOrIds.length === 0)) {
                        data[relationFieldName] = relationField.many ? [] : null;
                    } else {
                        if (relationField.many) {
                            const records = relationField.cache.getList(
                                idOrIds,
                                relationFieldPaths,
                                true
                            );
                            // If there are any records missing we consider the relation unfulfilled
                            if (records.length !== idOrIds.length) {
                                relationsMissing = true;
                                break;
                            }
                            data[relationFieldName] = records;
                        } else {
                            const relatedRecord = relationField.cache.get(
                                idOrIds,
                                relationFieldPaths
                            );
                            if (!relatedRecord) {
                                relationsMissing = true;
                                break;
                            }
                            data[relationFieldName] = relatedRecord;
                        }
                    }
                }
                // If any relations are missing continue searching
                if (relationsMissing) {
                    continue;
                }
                const r = new this.viewModel(data) as PartialViewModel<ViewModelClassType>;
                this.setValueForKey(key, r);
                if (r) {
                    this.setupRelationListeners(key, r);
                }
                return r;
            }
        }
        return null;
    }

    /**
     * Remove specified key from cache, cleanup any relation listeners and trigger
     * listener callbacks if required.
     * @private
     */
    private cleanupKey(key: ViewModelFieldPaths<ViewModelClassType>): void {
        this.setValueForKey(key, null);
        this.relationListenerUnsubscribe.get(key)?.forEach(unsub => unsub());
    }

    /**
     * Delete a record for the specified field names.
     *
     * Returns `true` if anything was deleted otherwise `false`
     */
    delete(fieldNames?: FieldPaths<ViewModelClassType>): boolean {
        if (!fieldNames) {
            let anyDeleted = false;
            for (const key of this.cache.keys()) {
                anyDeleted = true;
                this.cleanupKey(key);
            }
            return anyDeleted;
        }
        const key = normalizeFields(this.viewModel, fieldNames);
        if (!this.cache.has(key)) {
            return false;
        }
        this.cleanupKey(key);
        return true;
    }

    /**
     * Given a `baseRecord` with no related fields resolved (ie. we just have the id's, not the nested records) construct
     * a record with all the nested records attached if those records exist in the cache. If any requested record doesn't
     * exist in the cache then this will return `null`.
     *
     * @param key The key that contains the relations we need to resolve
     * @param baseRecord The record with the id's of the related records
     * @private
     */
    private constructWithRelatedRecords(
        key: ViewModelFieldPaths<ViewModelClassType>,
        baseRecord: PartialViewModel<ViewModelClassType>
    ): PartialViewModel<ViewModelClassType> | null {
        // Only keep the fields that are actually in `key` - any extra fields on baseRecord are discarded
        const newData = pick(baseRecord, key.nonRelationFieldNames);
        for (const [relationFieldName, relationFieldPath] of Object.entries(key.relations)) {
            const relationField = this.viewModel.getField(
                relationFieldName
            ) as BaseRelatedViewModelField<any, any, any>;
            const idOrIds = baseRecord[relationField.sourceFieldName];
            if (idOrIds == null || (Array.isArray(idOrIds) && idOrIds.length === 0)) {
                newData[relationFieldName] = relationField.many ? [] : null;
            } else {
                if (Array.isArray(idOrIds)) {
                    const records = relationField.cache.getList(idOrIds, relationFieldPath, true);
                    if (records.length !== idOrIds.length) {
                        return null;
                    }
                    newData[relationFieldName] = records;
                } else {
                    const record = relationField.cache.get(idOrIds, relationFieldPath);
                    if (!record) {
                        return null;
                    }
                    newData[relationFieldName] = record;
                }
            }
        }
        return new this.viewModel(newData) as PartialViewModel<ViewModelClassType>;
    }

    private relationListenerPaths = new Map<
        PartialViewModel<ViewModelClassType>,
        ViewModelFieldPaths<ViewModelClassType>[]
    >();

    /**
     * When a listener is added to a record for a set of fields we need to also listen
     * to changes on the caches for any related records. This functions handles setting
     * up those listeners.
     * @param key The key the listener was added to. The relations that need to be listened to are extracted from this.
     * @param record The last record that the listener would have been notified about. When the listener is first
     * added this will be the current record in the cache. When the record changes this will be the new record that
     * was just added.
     * @private
     */
    private setupRelationListeners(
        key: ViewModelFieldPaths<ViewModelClassType>,
        record: PartialViewModel<ViewModelClassType>
    ): void {
        let registeredPaths = this.relationListenerPaths.get(record);
        if (!registeredPaths) {
            registeredPaths = [];
            this.relationListenerPaths.set(record, registeredPaths);
        }
        if (registeredPaths.includes(key)) {
            return;
        }
        registeredPaths.push(key);
        // This may already be set for a previous call to this function for a different record (ie.
        // a previous version of the record with different related record id(s)). In that case remove
        // the old listeners and add new ones to ensure they match the latest related record id(s).
        this.relationListenerUnsubscribe.get(key)?.forEach(unsub => unsub());
        const relationUnsubscribes: ChangeListenerUnsubscribe[] = [];
        for (const [relationFieldName, relationFieldPath] of Object.entries(key.relations)) {
            const relationField = this.viewModel.getField(
                relationFieldName
            ) as BaseRelatedViewModelField<any, any, any>;
            if (record[relationField.sourceFieldName] != null) {
                relationUnsubscribes.push(
                    relationField.cache.addListener(
                        record[relationField.sourceFieldName],
                        relationFieldPath,
                        () => {
                            // When a related field changes check if this record is still in the cache.
                            const record = this.get(
                                normalizeFields(
                                    this.viewModel,
                                    key.nonRelationFieldNames as FieldPath<ViewModelClassType>[]
                                )
                            );
                            if (record) {
                                // If it is re-create it with updated relation values
                                const recordWithRelations = this.constructWithRelatedRecords(
                                    key,
                                    record
                                );
                                this.setValueForKey(key, recordWithRelations);
                            }
                        },
                        false
                    )
                );
            }
        }
        this.relationListenerUnsubscribe.set(key, relationUnsubscribes);
    }

    /**
     * Add a listener for any changes, additions or deletions for the specified field names
     * @param fieldNames field names to listen to any changes for. See [Field notation](#Field_notation) for supported format.
     * @param listener Function to call with any changes
     */
    addListener(
        fieldNames: FieldPaths<ViewModelClassType>,
        listener: ChangeListener<PartialViewModel<ViewModelClassType>>
    ): ChangeListenerUnsubscribe {
        const key = normalizeFields(this.viewModel, fieldNames);
        let listeners = this.cacheListeners.get(key);
        if (!listeners) {
            listeners = [];
            this.cacheListeners.set(key, listeners);
        }
        listeners.push(listener);
        const unsub = (): void => {
            if (listeners) {
                const index = listeners.indexOf(listener);

                if (index !== -1) {
                    listeners.splice(index, 1);
                }
            }
        };
        if (key.nonRelationFieldNames.length !== key.fieldPaths.length) {
            // If there is relations then also add a specific listener on all the non-relation fields.
            // When just those fields change we can just re-create the record with the current value of
            // the relation fields.
            const unsubs = [unsub];
            unsubs.push(
                this.addListener(
                    key.nonRelationFieldNames as FieldPath<ViewModelClassType>[],
                    (before, after) => {
                        if (after) {
                            this.setupRelationListeners(key, after);
                            const recordWithRelations = this.constructWithRelatedRecords(
                                key,
                                after
                            );
                            this.setValueForKey(key, recordWithRelations);
                        }
                    }
                )
            );
            // If record currently exists then setup the relation listeners and construct a version of the
            // record with all the relations filled out (necessary for the listener to know previous value)
            const record = this.get(
                normalizeFields(
                    this.viewModel,
                    key.nonRelationFieldNames as FieldPath<ViewModelClassType>[]
                )
            );
            if (record) {
                this.setupRelationListeners(key, record);
                const recordWithRelations = this.constructWithRelatedRecords(key, record);
                // Note that this won't fire any listeners as listenersEnabled will be false
                this.setValueForKey(key, recordWithRelations);
            }
            return (): void => {
                unsubs.forEach(fn => fn());
                this.relationListenerUnsubscribe.get(key)?.forEach(unsub => unsub());
            };
        }

        return unsub;
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
            pending = this.pending;
            while (pending.size > 0) {
                this.pending = new Map();
                pending.forEach(([before, after], cb) => cb(before, after));
                pending = this.pending;
            }
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
 * <Alert type="info">See the [ViewModel getting started guide](/docs/getting-started/viewmodel) for a overview of ViewModel's and how caching works</Alert>
 *
 * Caching is based on the primary key, and the fields that are specified when creating an instance. For example, the
 * following two instances are cached separately:
 *
 * ```typescript
 * const user1 = User.cache.add({ id: 1, name: 'John' });
 * const user2 = User.cache.add({ id: 1, email: 'john@example.com' });
 * ```
 *
 * When you read from the cache you specify the fields (or `"*"` for all fields):
 *
 * ```typescript
 * User.cache.get(1, ['name']);
 * // { id: 1, name: 'John' }
 * User.cache.get(1, ['email']);
 * //  id: 1, email: 'john@example.com'
 * ```
 *
 * An update to a superset of fields will update all cached subsets:
 *
 * ```typescript
 * User.cache.add({
 *     id: 1,
 *     name: 'Johnny Smith',
 *     email: 'johnny@test.com',
 * });
 * console.log(User.cache.get(1, ['id', 'name']));
 * // { id: 1, name: 'Johnny Smith' }
 * console.log(User.cache.get(1, ['id', 'email']));
 * // { id: 1, email: 'johnny@test.com' }
 * ```
 *
 * The motivation for this behaviour is that it's more desirable for have records be internally consistent than to have each individual
 * field reflect the latest value. Having partial records is useful for restricting the amount of data that is sent to the
 * frontend.
 *
 * <Usage>
 *
 * ### Adding records
 *
 * Use `add` to add a single record.
 *
 * ```js
 * User.cache.add(new User({ id: 1, name: 'John' }));
 * ```
 *
 * Using the ViewModel constructor is optional - you can pass the data directly
 *
 * ```js
 * User.cache.add({ id: 1, name: 'John' });
 * ```
 *
 * The primary key is always required, everything else is optional.
 *
 * Use `addList` to add multiple records simultaneously. This is preferred to using `add` multiple times as it avoids
 * firing multiple change events.
 *
 * ```js
 * User.cache.addList([{ id: 1, name: 'John'} , { id: 2, name: 'Jane' }]);
 * ```
 *
 * ### Updating records
 *
 * Updating a record is the same as adding it again:
 *
 * ```js
 * User.cache.add(new User({ id: 1, name: 'John' }));
 * ```
 *
 * ### Retrieving records
 *
 * Use `get` to retrieve a single record by from the cache. You must specify the list of fields to include, or `"*"`
 * for all fields.
 *
 * ```js
 * const record = User.cache.get(1, ['name']);
 * ```
 *
 * Note that the primary key is always included, so explicitly including it in the list of fields is optional.
 *
 * If you wish to get the latest version of a record you can pass the ViewModel instance itself instead of the id and fields:
 *
 * ```js
 * const latestRecord = User.cache.get(record);
 * ```
 *
 * Use `getList` to retrieve multiple records:
 *
 * ```js
 * const records = User.cache.getList([1, 2], ['name']);
 * ```
 *
 * `getAll` can be used to retrieve all cached records:
 *
 * ```js
 * const records = User.cache.getAll(['name']);
 * ```
 *
 * ### Deleting records
 *
 * Use `delete` to delete a single record, either for a specific subset of fields or all cached records.
 *
 * ```js
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
 * ```
 *
 * ### Listening to changes
 *
 * You can listen to changes using `addListener`.
 *
 * > To listen for changes and re-render a component use the [useViewModelCache](doc:useViewModeCache) hook.
 *
 * ```js
 * User.cache.addListener(2, ['id', 'name'], (previous, next) => console.log(previous, 'change to', next));
 * User.cache.add(new User({ id: 2, name: 'Bob' }));
 * // null changed to User({ id: 2, name: 'Bob' })
 * User.cache.add(new User({ id: 2, name: 'Bobby' }));
 * // User({ id: 2, name: 'Bob' }) changed to User({ id: 2, name: 'Bobby' })
 * User.cache.delete(2)
 * // User({ id: 2, name: 'Bobby' }) changed to null
 * ```
 *
 * You can listen to changes to multiple records with `addListenerList`. Used with `addList` and you will get one
 * notification for each batch of changes:
 *
 * ```js
 * // call for each change that occurs within addList
 * User.cache.addListenerList(
 *  // Ids to listen for changes to
 *  [3, 4],
 *  // Only get updates for cached records with these field names
 *  ['id', 'name'],
 *  (previous, next) => console.log(previous, 'change to', next)
 * );
 * User.cache.addList([new User({ id: 3, name: 'Jay' }), new User({ id: 4, name: 'Bee' })]);
 * // [null, null] changed to [User({ id: 3, name: 'Jay' }), User({ id: 4, name: 'Bee' })]
 * User.cache.addList([new User({ id: 3, name: 'Jayz' }), new User({ id: 4, name: 'Beeb' })]);
 * // [User({ id: 3, name: 'Jay' }), User({ id: 4, name: 'Bee' })] changed to [new User({ id: 3, name: 'Jayz' }), new User({ id: 4, name: 'Beeb' })]
 * User.cache.delete(3)
 * // [User({ id: 3, name: 'Jayz' }), User({ id: 4, name: 'Beeb' })] changed to [null, User({ id: 4, name: 'Beeb' })]
 * ```
 *
 * </Usage>
 *
 * ## Field notation
 *
 * If a model has a [RelatedViewModelField](doc:RelatedViewModelField), the data for a related field
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
 * Using the shorthand for a relation won't include any nested relation. To fetch deeply related records you must
 * explicitly opt in:
 *
 * ```js
 * ['name', 'group', ['group', 'owner']]
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
    viewModel: ViewModelClassType;
    private fieldNameCache: Map<string, RecordFieldNameCache<ViewModelClassType>>;
    static listenerBatcher = defaultListenerBatcher;

    /**
     * @param viewModel The `ViewModel` this class is for
     */
    constructor(viewModel: ViewModelClassType) {
        this.viewModel = viewModel;
        this.fieldNameCache = new Map();
    }

    get cache(): never {
        throw new Error(
            "'cache' property renamed to 'fieldNameCache'. This is a private implementation detail and should not be used."
        );
    }

    /**
     * Checks if value `a` is an instance of the ViewModel this cache is for
     */
    private isInstanceOfModel(a: any): a is PartialViewModel<ViewModelClassType> {
        return a instanceof this.viewModel;
    }

    /**
     * Get the cache key to use into for the primary key. Handles compound keys.
     */
    private getPkCacheKey(pk: ExtractPkFieldParseableValueType<ViewModelClassType>): string {
        if (typeof pk === 'object') {
            return this.viewModel.pkFieldNames
                .map(fieldName => pk[fieldName])
                .join(CACHE_KEY_FIELD_SEPARATOR);
        }
        return pk.toString();
    }

    /**
     * Acquire the field name cache specific to a primary key
     *
     * @param pk The primary key to get the cache for
     *
     * @private
     */
    private acquireFieldNameCache(
        pk: ExtractPkFieldParseableValueType<ViewModelClassType>
    ): RecordFieldNameCache<ViewModelClassType> {
        const pkKey = this.getPkCacheKey(pk);
        let recordCache = this.fieldNameCache.get(pkKey);
        if (!recordCache) {
            recordCache = new RecordFieldNameCache(this.viewModel, pk, this.onAnyChange.bind(this));
            this.fieldNameCache.set(pkKey, recordCache);
        }

        return recordCache;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    private get cacheClass() {
        return Object.getPrototypeOf(this).constructor;
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

    /**
     * Add a record or records to the cache. Records are cached based on the fields that are
     * set (ie. to retrieve the record you would call `get` with the `id` and array of field
     * names that were set on it).
     *
     * If record A has a superset of fields of record B then when A is cached it
     * will update the cache for record B. The reverse isn't true so as to maintain consistency
     * within a record.
     *
     * ```js
     * const user = User.cache.add(new User({ id: 1, name: 'Bob' }));
     * // `user` is the passed instance of `User`
     * // The above is equivalent to
     * const user = User.cache.add({ id: 1, name: 'Bob' });
     * // `user` is the created instance of `User`
     * ```
     *
     * @param recordOrData The record instance to cache. If a plain object is passed then
     * an instance of the view model will be created and returned. An array is also supported
     * in which case each entry in the array will be converted to the view model if required
     * and returned.
     *
     * @returns The cached record as an instance of the view model.
     *
     * @exclude-overload-docs
     */
    add<T extends PartialViewModel<ViewModelClassType>>(recordOrData: T): T;
    add<T extends PartialViewModel<ViewModelClassType>>(recordOrData: T[]): T[];
    add<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        recordOrData: FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>
    ): PartialViewModel<ViewModelClassType, FieldNames>;
    add<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        recordOrData: FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>[]
    ): PartialViewModel<ViewModelClassType, FieldNames>[];
    add<
        T extends PartialViewModel<ViewModelClassType>,
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
        let record: PartialViewModel<ViewModelClassType>;
        if (!this.isInstanceOfModel(recordOrData)) {
            if (isViewModelInstance(recordOrData)) {
                let message = `Attempted to cache ViewModel of type ${recordOrData._model} in cache for ${this.viewModel}.`;
                if (isDev()) {
                    message +=
                        ' If you are using hot loading this can cause instanceof checks to fail when the class is recreated - if this is the case a hard refresh should resolve the issue.';
                }
                throw new Error(message);
            }
            record = new this.viewModel(recordOrData) as PartialViewModel<ViewModelClassType>;
        } else {
            record = recordOrData;
        }
        if (!record._assignedFields) {
            throw new Error('_assignedFields not set on record; cannot be cached');
        }
        const fieldNameCache = this.acquireFieldNameCache(record._key);
        return withEnableListeners(() => {
            return this.cacheClass.listenerBatcher.batch(() => {
                fieldNameCache.add(record);
                return record;
            });
        });
    }

    /**
     * Adds a list of records to the cache. This method is preferred over manually invoking add() for each record
     * individually, as it ensures listeners are only notified once about the changes to the list, rather than receiving
     * a notification for each individual record added.
     *
     * ```js
     * User.cache.addList([{ id: 1, name: 'John'} , { id: 2, name: 'Jane' }]);
     * ```
     *
     * @param recordsOrData The records to add. Can either be an array of instances of the ViewModel
     * or an array of data objects (or a mixture of both).
     *
     * @exclude-overload-docs
     */
    addList<T extends PartialViewModel<ViewModelClassType>>(recordsOrData: T[]): T[];
    addList<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        recordsOrData: FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>[]
    ): PartialViewModel<ViewModelClassType, FieldNames>[];
    addList<
        T extends PartialViewModel<ViewModelClassType>,
        FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>
    >(
        recordsOrData: (T | FieldDataMappingRaw<Pick<ViewModelClassType['fields'], FieldNames>>)[]
    ): (T | PartialViewModel<ViewModelClassType, FieldNames>)[] {
        return withEnableListeners(() => {
            return this.cacheClass.listenerBatcher.batch(() => {
                return recordsOrData.map(record => this.add(record)) as T[];
            });
        });
    }

    /**
     * Get a record with the specified `fieldNames` set from the cache.
     *
     * ```js
     * User.cache.get(1, ['name']);
     * ```
     *
     * Note that the primary key is always returned, so you do not need to specify it in `fieldNames`.
     *
     * To retrieve all fields use `"*"`. See [Field notation](#Field-notation) for supported format.
     *
     * ```js
     * User.cache.get(1, '*');
     * ```
     *
     * To get the latest version of a record you can pass the record directly and omit the fields:
     *
     * ```js
     * User.cache.get(user);
     * ```
     *
     * Each typescript overload is documented below.
     *
     * @param pk the primary key of the record to get, or an instance of the ViewModel to get.
     * @param fieldNames the field names to use to look up the cache entry. Use '*' to indicate all fields.
     * See [Field notation](#Field_notation) for supported format.
     *
     * @returns The cached record, or null if none found
     */
    get<T extends FieldPath<ViewModelClassType>>(
        pk: ExtractPkFieldParseableValueType<ViewModelClassType>,
        fieldNames: T[]
    ): PartialViewModel<ViewModelClassType, T> | null;
    /**
     * Convenience overload to get a record with all fields set from the cache.
     *
     * @param pk The primary key of the record to get.
     * @param fieldNames The string `"*"`
     */
    get(
        pk: ExtractPkFieldParseableValueType<ViewModelClassType>,
        fieldNames: '*'
    ): PartialViewModel<
        ViewModelClassType,
        ExtractStarFieldNames<ViewModelClassType['fields']>
    > | null;
    /**
     * Convenience overload to get the latest version of the passed record
     *
     * @param record The record to re-fetch from the cache
     */
    get<T extends FieldPath<ViewModelClassType>>(
        record: PartialViewModel<ViewModelClassType, T>
    ): PartialViewModel<ViewModelClassType, T> | null;
    get(
        pkOrRecord:
            | ExtractPkFieldParseableValueType<ViewModelClassType>
            | PartialViewModel<ViewModelClassType>
            | (
                  | PartialViewModel<ViewModelClassType>
                  | ExtractPkFieldParseableValueType<ViewModelClassType>
              )[],
        fieldNames?: FieldPath<ViewModelClassType>[] | '*'
    ): PartialViewModel<ViewModelClassType> | null {
        let pk = pkOrRecord;
        let normalizedFields: ViewModelFieldPaths<ViewModelClassType> | undefined;
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
            normalizedFields =
                pk._assignedFieldPaths as unknown as ViewModelFieldPaths<ViewModelClassType>;
            pk = pk._key;
        }
        if (!fieldNames && !normalizedFields) {
            throw new Error('fieldNames must be provided');
        }
        if (pk == null) {
            throw new Error('Primary key must be provided');
        }
        const { pkFieldName } = this.viewModel;
        const isCompound = Array.isArray(pkFieldName);
        if (isCompound && typeof pk !== 'object') {
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

        if (!normalizedFields) {
            normalizedFields = normalizeFields(
                this.viewModel,
                fieldNames as FieldPaths<ViewModelClassType>
            );
        }
        const fieldNameCache = this.acquireFieldNameCache(pk);
        // If record exists under fieldNames key already then return it
        let record = fieldNameCache.get(normalizedFields);
        if (record) {
            return record;
        }
        return null;
    }

    /**
     * @private
     */
    _lastAllRecords: Map<
        ViewModelFieldPaths<ViewModelClassType>,
        PartialViewModel<ViewModelClassType>[]
    > = new Map();

    /**
     * Get all records in the cache for the specified field names. This acts like `getList` but returns
     * all records not just records with specified primary keys.
     *
     * This function guarantees to return the same array (ie. passes strict equality check) if the underlying
     * records have not changed.
     *
     * @param fieldNames List of field names to return records for. See [Field notation](#Field_notation) for supported format.
     */
    getAll(
        fieldNames: '*'
    ): PartialViewModel<ViewModelClassType, ExtractStarFieldNames<ViewModelClassType['fields']>>[];
    getAll<T extends FieldPath<ViewModelClassType>>(
        fieldNames: T[]
    ): PartialViewModel<ViewModelClassType, T>[];
    getAll<T extends FieldPath<ViewModelClassType>>(
        fieldNames: T[] | '*'
    ): PartialViewModel<ViewModelClassType, T>[] {
        const records: PartialViewModel<ViewModelClassType>[] = [];
        let index = 0;
        const key = normalizeFields(this.viewModel, fieldNames);
        const lastRecords = this._lastAllRecords.get(key) || [];
        // Tracks if records have changed from what is stored in `lastRecords`
        let isRecordsSame = true;
        for (const recordCache of this.fieldNameCache.values()) {
            const pk = recordCache.recordPk;
            // TODO: This one is wierd - can't resolve overload for T[] | '*' but it does if you do something silly like:
            // const record = fieldNames === '*' ? this.get(pk, fieldNames) : this.get(pk, fieldNames);
            // But that's equivalent to the below... so adding `any` cast to go with shorter version
            const record = this.get(pk, fieldNames as any);
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
    getList<T extends FieldPath<ViewModelClassType>, RemoveNullsT extends boolean = true>(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: T[],
        removeNulls?: RemoveNullsT
    ): RemoveNullsT extends true
        ? PartialViewModel<ViewModelClassType, T>[]
        : (PartialViewModel<ViewModelClassType, T> | null)[];
    getList<RemoveNullsT extends boolean = true>(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: '*',
        removeNulls?: RemoveNullsT
    ): RemoveNullsT extends true
        ? PartialViewModel<
              ViewModelClassType,
              ExtractStarFieldNames<ViewModelClassType['fields']>
          >[]
        : (PartialViewModel<
              ViewModelClassType,
              ExtractStarFieldNames<ViewModelClassType['fields']>
          > | null)[];
    /**
     * Get list of cached records from an existing list of records
     *
     * @param records List of existing ViewModel records to get latest cache version for
     * @param removeNulls whether to remove entries that have no record in the cache. Defaults to true.
     * @returns an array of the cached records. Any records not found will be in the array as a null value if `removeNulls` is false otherwise they will be removed.
     **/
    getList<
        T extends ViewModelInterface<
            ViewModelClassType['fields'],
            ViewModelClassType['pkFieldName']
        >,
        RemoveNullsT extends boolean = true
    >(records: T[], removeNulls?: RemoveNullsT): RemoveNullsT extends true ? T[] : (T | null)[];
    getList<T extends FieldPath<ViewModelClassType>, RemoveNullsT extends boolean = true>(
        records: PartialViewModel<ViewModelClassType, T>[],
        removeNulls?: RemoveNullsT
    ): RemoveNullsT extends true
        ? PartialViewModel<ViewModelClassType, T>[]
        : (PartialViewModel<ViewModelClassType, T> | null)[];
    getList(
        pksOrRecords: (
            | PartialViewModel<ViewModelClassType>
            | ExtractPkFieldParseableValueType<ViewModelClassType>
        )[],
        fieldNames?: FieldPaths<ViewModelClassType> | boolean,
        removeNulls = true
    ): (PartialViewModel<ViewModelClassType> | null)[] {
        if (pksOrRecords.length === 0) {
            return [];
        }
        let records: (PartialViewModel<ViewModelClassType> | null)[] = [];
        if (!fieldNames || fieldNames === true) {
            removeNulls = fieldNames == null ? true : fieldNames;
            records = pksOrRecords.map(record =>
                this.get(record as PartialViewModel<ViewModelClassType>)
            );
        } else {
            for (const pk of pksOrRecords) {
                records.push(this.get(pk, fieldNames as FieldPath<ViewModelClassType>[]));
            }
        }
        if (removeNulls) {
            return records.filter(Boolean) as PartialViewModel<ViewModelClassType>[];
        }
        return records as (PartialViewModel<ViewModelClassType> | null)[];
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
        fieldNames?: FieldPaths<ViewModelClassType>
    ): boolean {
        this.acquireFieldNameCache(pk);
        const pkKey = this.getPkCacheKey(pk);
        const recordCache = this.fieldNameCache.get(pkKey);
        if (!recordCache) {
            return false;
        }
        return withEnableListeners(() => this.batch(() => recordCache.delete(fieldNames)));
    }

    /**
     * @private
     */
    allChangeListeners: (() => void)[] = [];

    private onAnyChange(): void {
        this.allChangeListeners.forEach(cb => cb());
    }

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
    addListener<T extends FieldPath<ViewModelClassType>>(
        pkOrPks: ExtractPkFieldParseableValueType<ViewModelClassType>,
        fieldNames: T[],
        listener: ChangeListener<PartialViewModel<ViewModelClassType, T>>,
        batch?: boolean
    ): ChangeListenerUnsubscribe;
    addListener(
        pkOrPks: ExtractPkFieldParseableValueType<ViewModelClassType>,
        fieldNames: '*',
        listener: ChangeListener<
            PartialViewModel<
                ViewModelClassType,
                ExtractStarFieldNames<ViewModelClassType['fields']>
            >
        >,
        batch?: boolean
    ): ChangeListenerUnsubscribe;
    addListener<T extends FieldPath<ViewModelClassType>>(
        pkOrPks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: T[],
        listener: MultiChangeListener<PartialViewModel<ViewModelClassType, T>>,
        batch?: boolean
    ): ChangeListenerUnsubscribe;
    addListener(
        pkOrPksOrListener: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: '*',
        listener: MultiChangeListener<
            PartialViewModel<
                ViewModelClassType,
                ExtractStarFieldNames<ViewModelClassType['fields']>
            >
        >,
        batch?: boolean
    ): ChangeListenerUnsubscribe;
    addListener(
        pkOrPksOrListener:
            | ExtractPkFieldParseableValueType<ViewModelClassType>
            | ExtractPkFieldParseableValueType<ViewModelClassType>[]
            | AllChangesListener,
        fieldNames?: FieldPaths<ViewModelClassType>,
        listener?:
            | MultiChangeListener<PartialViewModel<ViewModelClassType>>
            | ChangeListener<PartialViewModel<ViewModelClassType>>,
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
                // Won't accept FieldPaths<ViewModelClassType> but will accept either '*' or
                // FieldPath<ViewModelClassType>[] - just cast to make it work
                fieldNames as FieldPath<ViewModelClassType>[],
                // TODO: I couldn't work out how to type this otherwise. I tried
                // function overload but doesn't seem to be possible to narrow
                // to type of the function to differentiate between ChangeListener
                // and MultiChangeListener
                listener as MultiChangeListener<PartialViewModel<ViewModelClassType>>
            );
        }
        const fieldNameCache = this.acquireFieldNameCache(pkOrPks);
        return fieldNameCache.addListener(fieldNames, (before, after) => {
            this.cacheClass.listenerBatcher.call(listener, before, after, batch);
        });
    }

    addListenerList<T extends FieldPath<ViewModelClassType>>(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: T[],
        listener: MultiChangeListener<PartialViewModel<ViewModelClassType, T>>
    ): ChangeListenerUnsubscribe;
    addListenerList(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: '*',
        listener: MultiChangeListener<
            PartialViewModel<
                ViewModelClassType,
                ExtractStarFieldNames<ViewModelClassType['fields']>
            >
        >
    ): ChangeListenerUnsubscribe;
    addListenerList<FieldNames extends ExtractFieldNames<ViewModelClassType['fields']>>(
        pks: ExtractPkFieldParseableValueType<ViewModelClassType>[],
        fieldNames: FieldPaths<ViewModelClassType>,
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
