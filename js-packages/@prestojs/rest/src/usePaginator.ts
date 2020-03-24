import { useMemo, useState } from 'react';
import Endpoint from './Endpoint';
import { PaginatorInterface, PaginatorInterfaceClass } from './Paginator';

/**
 * Hook to help manage paginator state. An instance of the specified paginator is created with provided
 * state setter or a default setter if none provided. You only need to provide a state setter if you
 * want to store the state somewhere external eg. from URL query parameters.
 *
 * @param paginatorClassOrEndpoint Must either be an `Endpoint` - in which case `Endpoint.getPaginatorClass()`
 * is called - or a  Paginator class. This class defines how paginator is handled.
 * @param currentStatePair A tuple of current state and a state setter function. If not provided state
 * is handled internally in usePaginator. You can pass `useState()` to this parameter.
 */
export default function usePaginator<T extends PaginatorInterface, PaginatorState>(
    paginatorClassOrEndpoint: PaginatorInterfaceClass<T> | Endpoint<T>,
    currentStatePair?: [PaginatorState | undefined, (value: PaginatorState) => void]
): T {
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

    if (paginatorClassOrEndpoint) {
        paginatorClass =
            paginatorClassOrEndpoint instanceof Endpoint
                ? paginatorClassOrEndpoint.getPaginatorClass()
                : paginatorClassOrEndpoint;
    }
    // It's expected that the paginator will be recreated regularly (ie. after every
    // state change) but memo it so that outside of that it is cached.
    return useMemo(
        () =>
            paginatorClass
                ? new paginatorClass(
                      [currentState, setCurrentState],
                      [internalState, setInternalState]
                  )
                : null,
        [currentState, internalState, paginatorClass, setCurrentState]
    );
}
