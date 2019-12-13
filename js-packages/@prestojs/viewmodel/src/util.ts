// eslint-disable-next-line @typescript-eslint/no-empty-function
function verifyMinified(): void {}

// Check inspired by immer
export const isDev = (): boolean =>
    typeof process !== 'undefined'
        ? process.env.NODE_ENV !== 'production'
        : verifyMinified.name === 'verifyMinified';

export function freezeObject(obj: {}): {} {
    if (isDev()) {
        return Object.freeze(obj);
    }
    return obj;
}
