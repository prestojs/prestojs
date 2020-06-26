type SingleId = string | number;
type CompoundId = { [fieldName: string]: SingleId };
export type Id = SingleId | CompoundId;

/**
 * Defines a property `_pk` which is taken as the `id`. [ViewModel](doc:ViewModelFactory)
 * always implements this interface.
 */
interface IdentifiablePk {
    /**
     * The id for this item
     */
    _pk: Id;
}

/**
 * Defines a property `id` to uniquely identify the item
 */
interface IdentifiableId {
    /**
     * The id for this item
     */
    id: Id;
}

/**
 * Interface for types that we can automatically extract a unique
 * identifier from.
 *
 * If a `_pk` property exists (eg. from [ViewModelFactory](doc:ViewModelFactory))
 * that will be used otherwise an `id` property will be used.
 *
 * Implementing this can save you having to pass explicit functions to identify an item in other parts of the system
 * (eg. for [AsyncChoices](doc:AsyncChoices) or [useAsyncValue](doc:useAsyncValue))
 *
 * @extract-docs
 * @menu-group Identifiable
 * @doc-class UnionInterface
 */
export type Identifiable = IdentifiableId | IdentifiablePk;

function isIdentifiablePk(item: any): item is IdentifiablePk {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return item._pk != null;
}

function isIdentifiableId(item: any): item is IdentifiableId {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return item.id != null;
}

/**
 * Check if a value conforms to Identifiable
 *
 * @extract-docs
 * @menu-group Identifiable
 */
export function isIdentifiable(item: any): item is Identifiable {
    return isIdentifiableId(item) || isIdentifiablePk(item);
}

/**
 * Get the id for an object. If object doesn't implement Identifiable then `fallbackGetId`
 * must be provided or an error will be thrown.
 * @param item Any value to get ID for
 * @param fallbackGetId Function to return id for `item` if it doesn't implement Identifiable
 *
 * @extract-docs
 * @menu-group Identifiable
 */
export function getId(item: Identifiable | any, fallbackGetId?: (item: any) => Id): Id {
    if (isIdentifiablePk(item)) {
        return item._pk;
    }
    if (isIdentifiableId(item)) {
        return item.id;
    }
    if (fallbackGetId) {
        return fallbackGetId(item);
    }
    throw new Error(
        'Provided item does not implement Identifiable and no fallback getter was specified.'
    );
}

/**
 * Create string representation of ID suitable for strict equality
 * checking or as a key into an object / map.
 *
 * @extract-docs
 * @menu-group Identifiable
 */
export function hashId(id: Id): string {
    if (id == null) {
        return id;
    }
    if (typeof id == 'object') {
        const f = Object.keys(id);
        f.sort();
        return JSON.stringify(
            f.reduce((acc, fieldName) => {
                acc[fieldName] = id[fieldName];
                return acc;
            }, {})
        );
    }
    return JSON.stringify(id);
}

/**
 * Check if two objects share the same ID.
 *
 * NOTE: Doesn't compare objects for equality; only their id
 *
 * @extract-docs
 * @menu-group Identifiable
 */
export function isSameById(
    item1: Identifiable | any,
    item2: Identifiable | any,
    fallbackGetId?: (item: any) => Id
): boolean {
    if (item1 == null || item2 == null) {
        return false;
    }
    const id1 = getId(item1, fallbackGetId);
    const id2 = getId(item2, fallbackGetId);
    if (id1 === id2) {
        return true;
    }
    if (id1 && id2 && typeof id1 == 'object' && typeof id2 == 'object') {
        const keys = Object.keys(item1);
        if (keys.length !== Object.keys(item2).length) {
            return false;
        }
        for (const key of keys) {
            if (item1[key] !== item2[key]) {
                return false;
            }
        }
        return true;
    }
    return false;
}
