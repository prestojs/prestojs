import { useEffect, useMemo, useRef, useState } from 'react';
import { PaginatorInterface, PaginatorInterfaceClass } from './Paginator';

export interface PaginatorClassProvider<T extends PaginatorInterface> {
    getPaginatorClass(): PaginatorInterfaceClass<T> | null;
}

function isPaginatorClassProvider<T extends PaginatorInterface>(
    item: any
): item is PaginatorClassProvider<T> {
    return item && typeof item.getPaginatorClass === 'function';
}

/** @hidden */
export default function usePaginator<PaginatorT extends PaginatorInterface, PaginatorState>(
    paginatorClassOrProvider:
        | PaginatorInterfaceClass<PaginatorT>
        | PaginatorClassProvider<PaginatorT>,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): PaginatorT;
/** @hidden */
export default function usePaginator<PaginatorState>(
    paginatorClassOrProvider: null,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): null;
// This is only necessary because the type is inferred as PaginatorInterfaceClass<T> | null here
// instead of refining it based on endpoint
// export function ExampleComponent({ endpoint }: { endpoint: Endpoint | null }) {
//     usePaginator(endpoint && endpoint.getPaginatorClass());
// }
/** @hidden */
export default function usePaginator<PaginatorT extends PaginatorInterface, PaginatorState>(
    paginatorClassOrProvider:
        | PaginatorInterfaceClass<PaginatorT>
        | PaginatorClassProvider<PaginatorT>
        | null,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): PaginatorT | null;
/**
 * Hook to help manage paginator state. An instance of the specified paginator is created with provided
 * state setter or a default setter if none provided. You only need to provide a state setter if you
 * want to store the state somewhere external e.g. from URL query parameters.
 *
 * See examples for [CursorPaginator](doc:CursorPaginator#example-02-use-paginator), [PageNumberPaginator](doc:PageNumberPaginator#example-02-use-paginator)
 * or [LimitOffsetPaginator](doc:LimitOffsetPaginator#example-02-use-paginator)
 *
 * @param paginatorClassOrProvider Must either be an object with a `getPaginatorClass` method (eg.
 * [Endpoint](doc:Endpoint)) or a [Paginator](doc:Paginator) class. This class defines how pagination is
 * handled. This value can be `null` in which case nothing will be returned.
 * @param currentStatePair A tuple of current state and a state setter function. If not provided state
 * is handled internally in usePaginator. You can pass `useState()` to this parameter.
 *
 * @returns The paginator class instance
 *
 * @extractdocs
 * @menugroup Pagination
 */
export default function usePaginator<PaginatorT extends PaginatorInterface, PaginatorState>(
    paginatorClassOrProvider:
        | PaginatorInterfaceClass<PaginatorT>
        | PaginatorClassProvider<PaginatorT>
        | null,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): PaginatorT | null;
export default function usePaginator<PaginatorT extends PaginatorInterface, PaginatorState>(
    paginatorClassOrProvider:
        | PaginatorInterfaceClass<PaginatorT>
        | PaginatorClassProvider<PaginatorT>
        | null,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): PaginatorT | null {
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
    const paginatorInstance = useMemo<PaginatorT | null>(
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
    // state controllers on the old instance are replaced with a noop setter. This avoids
    // having a previous paginator setting the state that is being used on a newer paginator instance
    const lastPaginatorInstance = useRef(paginatorInstance);
    useEffect(() => {
        if (lastPaginatorInstance.current && lastPaginatorInstance.current !== paginatorInstance) {
            const noop = (): {} => {
                return {};
            };
            lastPaginatorInstance.current.replaceStateControllers([{}, noop], [{}, noop]);
            lastPaginatorInstance.current = paginatorInstance;
        }
    }, [paginatorInstance]);

    return paginatorInstance;
}
