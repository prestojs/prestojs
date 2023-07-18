/**
 * Type representing a single ID - eg. a number or string
 */
export type SingleId = string | number;
/**
 * Type representing a compound key, eg.
 *
 * ```js
 * {
 *     groupId: 5,
 *     userId: 10,
 * }
 * ```
 */
export type CompoundId = { [fieldName: string]: SingleId };

/**
 * Either a single id as a number or a string, or a compound id as an object
 * indexed by field name.
 */
export type Id = SingleId | CompoundId;

/**
 * Interface for types that we can automatically extract a unique identifier from.
 *
 * To conform to the interface provide a `_key` property or getter.
 *
 * [ViewModelFactory](doc:viewModelFactory) conforms to this so anything that expects an Identifiable
 * will accept a ViewModel.
 *
 * Implementing this can save you having to pass explicit functions to identify an item in other parts of the system
 * (eg. for [AsyncChoices](doc:AsyncChoices) or [useAsyncValue](doc:useAsyncValue))
 *
 * @extractdocs
 * @menugroup Identifiable
 */
export interface Identifiable {
    /**
     * The unique identifier for this item.
     */
    _key: Id;
}

/**
 * Check if a value conforms to [Identifiable](doc:Identifiable)
 *
 * ## Usage
 *
 * ```js
 * isIdentifiable({ _key: 1 }); // true
 * isIdentifiable(null); // false
 * isIdentifiable({ uuid: 'abc' }); // false
 * ```
 *
 * @param item The value to check whether conforms to [Identifiable](doc:Identifiable)
 * @extractdocs
 * @menugroup Identifiable
 */
export function isIdentifiable(item: any): item is Identifiable {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return item._key != null;
}

/**
 * Get the id for an object. If object doesn't implement [Identifiable](doc:Identifiable] then `fallbackGetId`
 * must be provided or an error will be thrown.
 *
 * ## Usage
 *
 * ```js
 * const items = [{ _key: 1 }, { uuid: 'abc123' }];
 * items.map(item => getId(item, obj => obj.uuid));
 * // [1, 'abc123']
 * ```
 *
 * @param item Any value to get ID for
 * @param fallbackGetId Function to return id for `item` if it doesn't implement Identifiable
 * @returns Either a single id as a number or a string, or a compound id as an object indexed by field name.
 *
 * @extractdocs
 * @menugroup Identifiable
 */
export function getId(item: Identifiable | any, fallbackGetId?: (item: any) => Id): Id {
    if (isIdentifiable(item)) {
        return item._key;
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
 * ## Usage
 *
 * ```js
 * hashId(5);
 * // 5
 * hashId({ userId: 7, groupId: 5 });
 * // '{"groupId":5,"userId":7}'
 * hashId({ userId: 7, groupId: 5 }) === hashId({ userId: 7, groupId: 5 });
 * // true
 * ```
 *
 * @extractdocs
 * @menugroup Identifiable
 */
export function hashId(id: string | number | Record<string, any>): string {
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
 * ## Usage
 *
 * ```js
 * isSameById({ _key: 1}, { _key: 1 }); // true
 * isSameById({ _key: 1}, { uuid: 1 }, item => item.uuid); // true
 * ```
 *
 * @param item1 First item to compare
 * @param item2 Second item to compare
 * @param fallbackGetId Function to return id for `item` if it doesn't implement Identifiable
 * @extractdocs
 * @menugroup Identifiable
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
