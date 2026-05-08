import { bindNavigationReset, NavigatedEventsApi } from './navigation';

describe('navigation reset binding', () => {
    test('should bind and unbind reset callback', () => {
        let listener: (() => void) | undefined;
        const onNavigated: NavigatedEventsApi = {
            addListener(callback): void {
                listener = callback;
            },
            removeListener(callback): void {
                if (listener === callback) {
                    listener = undefined;
                }
            },
        };

        const onReset = jest.fn();
        const unsubscribe = bindNavigationReset(onNavigated, onReset);
        expect(listener).toBe(onReset);

        (listener as () => void)();
        expect(onReset).toHaveBeenCalledTimes(1);

        unsubscribe();
        expect(listener).toBeUndefined();
    });

    test('should no-op if navigation api is unavailable', () => {
        const onReset = jest.fn();
        const unsubscribe = bindNavigationReset(undefined, onReset);
        expect(() => unsubscribe()).not.toThrow();
        expect(onReset).not.toHaveBeenCalled();
    });
});
