import isEqualWith from 'lodash/isEqualWith';
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
    // if called from `shallowequal` then no return here means it will do a normal shallow comparison
    // if called from `isEqualWith` then no return here means it will do a normal deep comparison
}

/**
 * Compare two values for equality. If either  value has an `isEqual` method this will be called
 * otherwise values will be compared shallowly.
 *
 * @param a First value to compare
 * @param b Second value to compare
 *
 * @extractdocs
 * @menugroup Comparison
 */
export function isEqual(a: any, b: any): boolean {
    return shallowequal(a, b, equalityCustomizer);
}

/**
 * Compare values deeply for equality. If an object has an `isEqual` method this
 * will be called otherwise values will be compared deeply.
 *
 * @param a First value to compare
 * @param b Second value to compare
 *
 * @extractdocs
 * @menugroup Comparison
 */
export function isDeepEqual(a: any, b: any): boolean {
    return isEqualWith(a, b, equalityCustomizer);
}
