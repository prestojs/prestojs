/**
 * Utility to check if a value is a promise
 *
 * ```js
 * isPromise(Promise.resolve()); // true
 * ```
 *
 * @param value The value to check if appears to be a promise
 * @extractdocs
 */
export function isPromise(value: any): value is Promise<any> {
    return Boolean(
        value &&
            (typeof value === 'object' || typeof value === 'function') &&
            typeof value.then === 'function'
    );
}
