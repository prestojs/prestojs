import { EndpointExecuteOptions } from './Endpoint';

export interface PaginatorInterface {
    getRequestInit(options: EndpointExecuteOptions): EndpointExecuteOptions;

    setResponse(response: Record<string, any>): void;
}

export interface PaginatorInterfaceClass<T extends PaginatorInterface = PaginatorInterface>
    extends Function {
    new (...args: any[]): T;
}

export default class Paginator<State, InternalState> implements PaginatorInterface {
    currentState: State;
    internalState: InternalState;
    setCurrentState: (set: State) => void;
    setInternalState: (set: InternalState) => void;

    /**
     * Paginator received 2 tuples of a state and state setter pair. This is expected to
     * match the same interface as `useState` in React. The following is a valid simple usage:
     *
     * ```js
     * new Paginator(useState(), useState());
     * ```
     *
     * As state is passed in and managed external to the class be aware that any data stored
     * on the class instance will be lost unless written with `setCurrentState` or `setInternalState`.
     * This design is a compromise between allowing a clear interface for how paginators should
     * be defined and allowing the state to be managed externally (eg. using React state).
     *
     * @param currentState
     * @param setCurrentState
     * @param internalState
     * @param setInternalState
     */
    constructor([currentState, setCurrentState], [internalState, setInternalState]) {
        this.currentState = currentState || {};
        this.setCurrentState = setCurrentState;
        this.internalState = internalState || {};
        this.setInternalState = setInternalState;
    }

    /**
     * Return the options to use with `Endpoint.execute` or `Endpoint.prepare`. Usually
     * this just involves setting `query` to the query string parameters for the paginator
     * but can also provide custom headers or different URL resolve arguments.
     *
     * @param options The existing options for the endpoint
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRequestInit(options: EndpointExecuteOptions): EndpointExecuteOptions {
        throw new Error('Not implemented');
    }

    /**
     * This is called when an `Endpoint` has resolved and is passed the response from the
     * endpoint. This is used to update the relevant paginator state  - eg. the total
     * number of records, next & previous cursors etc.
     * @param response The response as returned by the endpoint this paginator is used with.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setResponse(response: Record<string, any>): void {
        throw new Error('Not implemented');
    }
}
