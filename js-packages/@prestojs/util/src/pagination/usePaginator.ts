import { useEffect, useMemo, useState } from 'react';
import { PaginatorInterface, PaginatorInterfaceClass } from './Paginator';

export interface PaginatorClassProvider<T extends PaginatorInterface> {
    getPaginatorClass(): PaginatorInterfaceClass<T> | null;
}

function isPaginatorClassProvider<T extends PaginatorInterface>(
    item: any
): item is PaginatorClassProvider<T> {
    return item && typeof item.getPaginatorClass === 'function';
}

/**
 * Hook to help manage paginator state. An instance of the specified paginator is created with provided
 * state setter or a default setter if none provided. You only need to provide a state setter if you
 * want to store the state somewhere external eg. from URL query parameters.
 *
 * @param paginatorClassOrProvider Must either be an object with a `getPaginatorClass` method (eg.
 * [Endpoint](doc:Endpoint)) or a [Paginator](doc:Paginator) class. This class defines how pagination is
 * handled.
 * @param currentStatePair A tuple of current state and a state setter function. If not provided state
 * is handled internally in usePaginator. You can pass `useState()` to this parameter.
 *
 * @menu-group Pagination
 * @extract-docs
 */
export default function usePaginator<T extends PaginatorInterface, PaginatorState>(
    paginatorClassOrProvider: PaginatorInterfaceClass<T> | PaginatorClassProvider<T>,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): T;
export default function usePaginator<PaginatorState>(
    paginatorClassOrProvider: null,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): null;
// This is only necessary because the type is inferred as PaginatorInterfaceClass<T> | null here
// instead of refining it based on endpoint
// export function ExampleComponent({ endpoint }: { endpoint: Endpoint | null }) {
//     usePaginator(endpoint && endpoint.getPaginatorClass());
// }
export default function usePaginator<T extends PaginatorInterface, PaginatorState>(
    paginatorClassOrProvider: PaginatorInterfaceClass<T> | PaginatorClassProvider<T> | null,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): T | null;
export default function usePaginator<T extends PaginatorInterface, PaginatorState>(
    paginatorClassOrProvider: PaginatorInterfaceClass<T> | PaginatorClassProvider<T> | null,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): T | null {
    // Only used if currentStatePair is not provided. We have to create this regardless
    // as hooks can't be conditional.
    const defaultState = useState<PaginatorState>();
    if (!currentStatePair) {
        currentStatePair = defaultState;
    }
    const [currentState, setCurrentState] = currentStatePair;
    // Internal state is not publicly writeable but is publicly readable (eg. total)
    // As it is only readable it is not necessary to expose an interface for how this
    // state is stored - we can store it internally in this hook.
    const [internalState, setInternalState] = useState();

    let paginatorClass;

    if (paginatorClassOrProvider) {
        paginatorClass = isPaginatorClassProvider(paginatorClassOrProvider)
            ? paginatorClassOrProvider.getPaginatorClass()
            : paginatorClassOrProvider;
    }

    // Only recreate the paginator class instance when necessary (eg. if the type changes)
    const paginatorInstance = useMemo<T | null>(
        () => (paginatorClass ? new paginatorClass() : null),
        [paginatorClass]
    );
    if (paginatorInstance) {
        paginatorInstance.replaceStateControllers(
            [currentState, setCurrentState],
            [internalState, setInternalState]
        );
    }

    // On unmount or if the paginator instance changes (eg. if paginatorClass changed) then the
    // state controllers on the old instance are replaced with a noop setter. This avoids:
    // 1) Having a previous paginator setting the state that's is being used on a newer paginator instance
    // 2) Setting state after component unmounted and React logging an error
    useEffect(() => {
        return (): void => {
            const noop = (): {} => ({});
            paginatorInstance?.replaceStateControllers([{}, noop], [{}, noop]);
        };
    }, [paginatorInstance]);

    return paginatorInstance;
}
