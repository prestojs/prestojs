type SingleId = string | number;
type CompoundId = { [fieldName: string]: SingleId };
export type Id = SingleId | CompoundId;

/**
 * Interface for types that we can automatically extract a unique
 * identifier from.
 *
 * If a `_pk` property exists (eg. from [ViewModelFactory](doc:ViewModelFactory))
 * that will be used otherwise an `id` property will be used.
 *
 * @extract-docs
 */
export type Identifiable =
    | {
          id: Id;
          _pk?: Id;
      }
    | {
          id?: Id;
          _pk: Id;
      };

/**
 * Check if a value conforms to Identifiable
 */
export function isIdentifiable(item: any): item is Identifiable {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return item.id != null || item._pk != null;
}

/**
 * Get the id for an object. If object doesn't implement Identifiable then `fallbackGetId`
 * must be provided or an error will be thrown.
 * @param item Any value to get ID for
 * @param fallbackGetId Function to return id for `item` if it doesn't implement Identifiable
 */
export function getId(item: Identifiable | any, fallbackGetId?: (item: any) => Id): Id {
    if (isIdentifiable(item)) {
        if (item._pk != null) {
            return item._pk;
        }
        if (item.id != null) {
            return item.id;
        }
        // This will never happen as isIdentifiable checks this... but typescript doesn't
        // get it
        throw new Error('Item has a valid id field but no value set');
    }
    if (fallbackGetId) {
        return fallbackGetId(item);
    }
    throw new Error(
        'Provided item does not implement Identifiable and no fallback getter was specified.'
    );
}
const HASH_SEP = '⁞♥';
const FIELD_SEP = '⁞♦';

/**
 * Create string representation of ID suitable for strict equality
 * checking or as a key into an object / map.
 */
export function hashId(id: Id): string {
    // TODO: is 'hash' appropriate for what we are doing here?
    if (id == null) {
        return id;
    }
    if (typeof id == 'object') {
        // primary key field names are implicit; never include them in the key itself
        const f = Object.keys(id);
        f.sort();
        const parts: string[] = [];
        for (const name of f) {
            const value = id[name];
            if (
                name.includes(HASH_SEP) ||
                name.includes(FIELD_SEP) ||
                (typeof value == 'string' &&
                    (value.includes(HASH_SEP) || value.includes(FIELD_SEP)))
            ) {
                throw new Error(
                    `Compound id field name or value cannot include ${HASH_SEP} or ${FIELD_SEP}`
                );
            }
            parts.push(`${name}${FIELD_SEP}${value}`);
        }
        return f.join(HASH_SEP);
    }
    return id.toString();
}

/**
 * Check if two objects share the same ID.
 *
 * NOTE: Doesn't compare objects for equality; only their id
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
