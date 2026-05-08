export interface NavigatedEventsApi {
    addListener(callback: () => void): void;
    removeListener(callback: () => void): void;
}

export function bindNavigationReset(
    onNavigated: NavigatedEventsApi | undefined,
    onReset: () => void
): () => void {
    if (!onNavigated) {
        return () => undefined;
    }
    onNavigated.addListener(onReset);
    return (): void => {
        onNavigated.removeListener(onReset);
    };
}
