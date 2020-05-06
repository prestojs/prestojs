import shallowequal from 'shallowequal';

interface EqualityInterface {
    isEqual(b: any): boolean;
}

function supportsEqualityInterface(a: any): a is EqualityInterface {
    return (
        a && (typeof a == 'object' || typeof a === 'function') && typeof a.isEqual === 'function'
    );
}

function equalityCustomizer(a: any, b: any): boolean | undefined {
    if (supportsEqualityInterface(a)) {
        return a.isEqual(b);
    }
    if (supportsEqualityInterface(b)) {
        return b.isEqual(a);
    }
    // undefined return means shallowequal does normal shallow comparison
}

/**
 * Compare to values for equality. If has an `isEqual` method this will be called
 * otherwise values will be compared shallowly.
 */
export function isEqual(a: any, b: any): boolean {
    return shallowequal(a, b, equalityCustomizer);
}
