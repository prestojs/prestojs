/**
 * An object containing the below properties in addition to those accepted by [fetch init](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)
 *
 * @expand-properties
 */
export type PaginatorRequestOptions = Omit<RequestInit, 'headers'> & {
    /**
     * Any headers to add to the request. You can unset default headers that might be specified in the default
     * `Endpoint.defaultConfig.requestInit` by setting the value to `undefined`.
     */
    headers?: HeadersInit | Record<string, undefined | string>;
    /**
     * Any arguments for the [URL](doc:UrlPattern)
     */
    urlArgs?: Record<string, any>;
    /**
     * Any query request parameters
     */
    query?: Record<string, boolean | string | null | number>;
};

/**
 * eg. the return value from [Endpoint.execute](doc:Endpoint#method-execute)
 *
 * @expand-properties
 */
export type PaginationRequestDetails = {
    /**
     * Any query string parameters
     */
    query?: Record<string, boolean | string | null | number>;
    /**
     * Any arguments used to resolve URL
     */
    urlArgs?: Record<string, any>;
    /**
     * Resolved URL
     */
    url: string;
    /**
     * The `Response` object, if available
     */
    response?: Response;
    /**
     * The value returned by `decodedBody`. See [Endpoint.execute](doc:Endpoint#method-execute).
     *
     * This may be a sub-key of the data returned by `Endpoint.execute`, eg. if the `path` option is used in
     * [paginationMiddleware](doc:paginationMiddleware). eg. If `decodedBody` from the `Endpoint` was
     *
     * ```json
     * {
     *     users: {
     *         count: 10,
     *         results: [...],
     *     }
     *     extraDetails: {...}
     * }
     * ```
     *
     * and `paginationMiddleware` was used with `path: 'users'` then `decodedBody` would be:
     *
     * ```json
     * {
     *     count: 10,
     *     results: [...]
     * }
     * ```
     */
    decodedBody?: any;
};

/**
 * @typeParam State Type representing the state of the pagination
 * @typeParam InternalState Type representing the internal state of the pagination. Internal state refers to state that does not need to be restored (eg. pagination details from the URL for example)
 */
export interface PaginatorInterface<State = {}, InternalState = {}> {
    currentState: State;
    internalState: InternalState;
    setCurrentState: (set: State) => void;
    setInternalState: (set: InternalState) => void;
    responseIsSet: boolean;
    hasNextPage(): boolean;
    first(): void;
    firstState(): State | null;
    next(): void;
    nextState(): State | null;
    previous(): void;
    previousState(): State | null;
    getRequestInit(options: PaginatorRequestOptions): PaginatorRequestOptions;

    setResponse(response: Record<string, any>): void;

    replaceStateControllers(currentStatePair, internalStatePair): void;
}

export interface PaginatorInterfaceClass<T extends PaginatorInterface = PaginatorInterface>
    extends Function {
    new (...args: any[]): T;

    getPaginationState(requestDetails: PaginationRequestDetails): Record<string, any> | false;
}

/**
 * Base class for a paginator.
 *
 * @menu-group Pagination
 * @extract-docs
 * @typeParam State Type representing the state of the pagination. This is the state that would be serialized (eg. to the URL) and restored when the paginator is created (contrast this to `InternalState` which isn't (contrast this to `InternalState` which isn't).
 * @typeParam InternalState Type representing the internal state of the pagination. Internal state refers to state that does not need to be restored (eg. pagination details from the URL for example)
 */
export default abstract class Paginator<State extends {}, InternalState extends {}>
    implements PaginatorInterface<State, InternalState>
{
    currentState: State;
    internalState: InternalState & { responseIsSet?: boolean };
    setCurrentState: (set: State) => void;
    setInternalState: (set: InternalState) => void;

    /**
     * True once setResponse has been called and pagination state is known.
     */
    get responseIsSet(): boolean {
        return !!this.internalState.responseIsSet;
    }

    /**
     * @see documentation for `replaceStateControllers` for what `currentStatePair` and `internalStatePair` are
     */
    constructor(currentStatePair = null, internalStatePair = null) {
        if ((currentStatePair || internalStatePair) && !(currentStatePair && internalStatePair)) {
            throw new Error(
                'If one of `currentStatePair` and `internalStatePair` are specified both must be'
            );
        }
        if (currentStatePair && internalStatePair) {
            this.replaceStateControllers(currentStatePair, internalStatePair);
        }
    }

    /**
     * Paginator receives 2 tuples of a state and state setter pair. This is expected to
     * match the same interface as `useState` in React. The following is a valid simple usage:
     *
     * ```js
     * const paginator = new Paginator(useState(), useState());
     * ```
     *
     * Note that we can also pass the state controllers in via `replaceStateControllers` rather
     * than in the constructor. This is so we can memoize the `Paginator` instance which is desirable
     * when using the paginator as a dependency to React hooks.
     *
     * As state is passed in and managed external to the class be aware that any data stored
     * on the class instance will be lost unless written with `setCurrentState` or `setInternalState`.
     * This design is a compromise between allowing a clear interface for how paginators should
     * be defined and allowing the state to be managed externally (eg. using React state).
     *
     * @param currentStatePair The state object and setter (eg. from `useState`) that is used to store
     * and transition pagination state. Using this you can do things like easily store state in the URL
     * (eg. using `useUrlQueryState`) or other data sources.
     * @param internalStatePair The state object and setter that is used for internal state. Internal state
     * is stored separately as it does not need to be restored (eg. if you refresh the page). It is used
     * to store things like the total number of results or the current cursor. Passing `useState` here is
     * fine.
     */
    replaceStateControllers(currentStatePair, internalStatePair): void {
        const [currentState, setCurrentState] = currentStatePair;
        const [internalState, setInternalState] = internalStatePair;
        this.currentState = currentState || {};
        this.setCurrentState = (nextState: State): void => {
            // If multiple setCurrentState occur before the first is committed then
            // any reads of `this.currentState` will return the previous value (the
            // last time `replaceStateControllers` was called). Update the `currentState`
            // immediately when `setCurrentState` is called. This ensures any reads
            // use the latest value until it's replaced by the next call to
            // `replaceStateControllers`.
            this.currentState = nextState;
            setCurrentState(nextState);
        };
        this.internalState = internalState || {};
        this.setInternalState = (nextState): void => {
            // See explanation above `this.currentState = nextState`
            this.internalState = nextState;
            setInternalState({
                ...nextState,
                responseIsSet: true,
            });
        };
    }

    /**
     * Return the options to use with `Endpoint.execute` or `Endpoint.prepare`. Usually
     * this just involves setting `query` to the query string parameters for the paginator
     * but can also provide custom headers or different URL resolve arguments.
     *
     * @param options The existing options for the endpoint
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRequestInit(options: PaginatorRequestOptions): PaginatorRequestOptions {
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

    /**
     * Go to the first page.
     */
    first(): void {
        throw new Error('Not implemented');
    }

    /**
     * Return the state for the first page
     *
     * Does not transition state. To transition state call `first` instead.
     */
    firstState(): State {
        throw new Error('Not implemented');
    }

    /**
     * Go to the next page.
     */
    next(): void {
        throw new Error('Not implemented');
    }

    /**
     * Return the state for the next page
     *
     * Does not transition state. To transition state call `next` instead.
     */
    nextState(): State | null {
        throw new Error('Not implemented');
    }

    /**
     * Go to the previous page.
     */
    previous(): void {
        throw new Error('Not implemented');
    }

    /**
     * Return the state for the previous page
     *
     * Does not transition state. To transition state call `previous` instead.
     */
    previousState(): State | null {
        throw new Error('Not implemented');
    }

    /**
     * Returns true if there's more results after the current page
     */
    hasNextPage(): boolean {
        throw new Error('Not implemented');
    }
}
