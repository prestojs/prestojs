// eslint-disable-next-line @typescript-eslint/no-empty-function
function verifyMinified(): void {}

// Check inspired by immer
export const isDev = (): boolean =>
    typeof process !== 'undefined'
        ? process.env.NODE_ENV !== 'production'
        : verifyMinified.name === 'verifyMinified';

export function freezeObject<T extends {}>(obj: T): Readonly<T> {
    if (isDev()) {
        return Object.freeze(obj);
    }
    return obj;
}
