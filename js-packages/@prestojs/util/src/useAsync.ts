import isEqual from 'lodash/isEqual';
import isPlainObject from 'lodash/isPlainObject';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { isEqual as isEqualShallow } from './comparison';
import { isPromise } from './misc';
import useMemoOne from './useMemoOne';

type ReducerState<ResultT, ErrorT> = {
    result: ResultT | null;
    isLoading: boolean;
    error: ErrorT | null;
    // Id used to track calls. It is set by `start` and if `abort` is called with
    // the same `id` then it will reset isLoading state otherwise it will do nothing
    // This is to handle abort calls that do not happen in response to a new call
    // happening
    id?: number;
};

type ReducerAction<ResultT, ErrorT> =
    | {
          type: 'start';
          id: number;
      }
    | {
          type: 'abort';
          id: number;
      }
    | { type: 'reset' }
    | {
          type: 'success';
          payload: ResultT;
      }
    | {
          type: 'error';
          payload: ErrorT;
      };

function reducer<ResultT, ErrorT>(
    state: ReducerState<ResultT, ErrorT>,
    action: ReducerAction<ResultT, ErrorT>
): ReducerState<ResultT, ErrorT> {
    switch (action.type) {
        case 'abort':
            if (state.id === action.id) {
                return { ...state, isLoading: false };
            }
            return state;
        case 'reset':
            return { isLoading: false, error: null, result: null };
        case 'start':
            if (state.isLoading) {
                return { ...state, id: action.id };
            }
            return { ...state, isLoading: true, id: action.id };
        case 'error':
            return { isLoading: false, error: action.payload, result: null };
        case 'success':
            return { isLoading: false, result: action.payload, error: null };
        default:
            throw new Error(`Bad action ${action}`);
    }
}

const noop = (): void => undefined;

const MANUAL = 'MANUAL';
const SHALLOW = 'SHALLOW';
const DEEP = 'DEEP';
// We considered 'ONCE' but it's semantics are confusing in React world; the component could
// re-render with different props just because of where it appears in the component tree (eg.
// a common situation for this would be a route that uses parameters from the URL -
// <Router component={MyComponent} path="/a/:id/" />. Conceptually different pages but would
// re-use the same component if moved from /a/1/ to /a/b2/ if no explicit key was specified
// and so wouldn't re-call the function). As such we've decided not to include it.

// Defined like this as it works better with docgen
interface OnError<ErrorT> {
    /**
     * @param error The error that was thrown/rejected from the async function
     */
    (error: ErrorT): void;
}

interface OnSuccess<ResultT> {
    /**
     * @param result The result returned by the async function
     */
    (result: ResultT): void;
}

interface AsyncFunction<ResultT> {
    /**
     * @param args If `options.args` are passed to `useAsync` then they will be passed through to this function,
     * otherwise nothing will be passed.
     *
     * @returns Any value; this will be the value that is returned by `useAsync` in its `result` key
     */
    (...args: Array<any>): Promise<ResultT>;
}

/**
 * @expand-properties
 */
export type UseAsyncOptions<ResultT, ErrorT> = {
    /**
     * Determines when the function is called. Defaults to `MANUAL`.
     *
     * **NOTE**: If changing from `MANUAL` to anything else then the function will be called immediately regardless
     *
     * These are available as properties on `useAsync`:
     *
     * **useAsync.MANUAL (default)** - only called when you explicitly call `run`
     *
     * **useAsync.SHALLOW** - called whenever a shallow equality check fails. Compares previous async function,
     * and `option.args`. Passing an inline function (eg. `useAsync(() => ...)`) or an inline object
     * to args (eg. `useAsync(fn, { args: { filter: 1 } })`) with this option will result in an
     * infinite loop because each render dynamically creates a new object and only object identity is checked;
     * use `useMemo` or `useCallback` in these cases.
     *
     * **useAsync.DEEP** - called whenever a deep equality check fails. Compares previous async function and
     * `option.args`. Slower than `shallow` but works with objects that may change every render. Passing an
     * inline function (eg. `useAsync(() => ...)`) with this option will result in an infinite loop as a new
     * function is created each render and a deep equality check on this will always fail; use `useCallback` in
     * those cases.
     */
    trigger?: typeof MANUAL | typeof SHALLOW | typeof DEEP;
    /**
     * Arguments to be passed to the async function. Can be empty.
     *
     * If you are using `trigger` of `MANUAL` then it's usually simpler to just pass the arguments in `fn` manually
     * (eg. by defining an arrow function inline). When using other values of `trigger` the value of `args` is compared
     * and will trigger a call to `fn` when a change is detected according to the comparison logic of the
     * selected `trigger`.
     */
    args?: Array<any>;
    /**
     * Called when the async function resolves successfully. Is passed a single parameter which
     * is the result from the async function.
     *
     * **NOTE:** If your component unmounts before the promise resolves this function
     * will NOT be called. This is to avoid the general case of calling React
     * state transition functions on an unmounted component. If you want the
     * method to be called regardless then attach your own callbacks to the
     * promise when you call `run` or in the async function definition itself.
     */
    onSuccess?: OnSuccess<ResultT>;
    /**
     * Called when the async function errors. It is passed the error.
     *
     * See note above on `onSuccess` for behaviour when component has unmounted.
     */
    onError?: OnError<ErrorT>;
};

const validOptionKeys = ['trigger', 'args', 'onSuccess', 'onError'];

export type UseAsyncReturnObject<ResultT, ErrorT> = {
    /**
     * True when function call is in progress.
     */
    isLoading: boolean;
    /**
     * Set to the rejected value of the promise. Only one of `error` and `result` can be set. If
     * `isLoading` is true consider this stale (ie. based on _previous_ props). This can be useful
     * when you want the UI to show the previous value until the next value is ready.
     */
    error: ErrorT | null;
    /**
     * Set to the resolved value of promise. Only one of `error` and `result` can be set. If
     * `isLoading` is true consider this stale (ie. based on _previous_ props). This can be useful
     * when you want the UI to show the previous value until the next value is ready (for example showing
     * the previous page of a paginated table with a loading indicator while next page is loading).
     */
    result: ResultT | null;
    /**
     * @deprecated Use `result` instead
     */
    response: ResultT | null;
    /**
     * A function to manually trigger the function call. If `options.trigger` is `useAsync.MANUAL`
     * calling this function is the only way to trigger the function call. You can pass
     * arguments to `run` which will override the defaults. If no arguments are passed then
     * `options.args` will be passed by default (if supplied).
     *
     * This function will return a promise that resolves/rejects to same value
     * resolved/rejected from the async function.
     */
    run: (...args) => Promise<ResultT>;
    /**
     * When called will set both result or error to null. Will not immediately trigger
     * a call to the function but subsequent changes to `fn` or `options.args` will
     * according to the value of `trigger`.
     */
    reset: () => void;
};

const comparisonByTrigger = {
    [DEEP]: isEqual,
    [SHALLOW]: isEqualShallow,
    // Always equal
    [MANUAL]: (): true => true,
};

/**
 * Hook to deal with triggering async function calls and handling result / errors and loading states.
 *
 * This can be used in two distinct modes:
 *  - _manual_ (`useAsync.MANUAL`) - the function is only triggered explicitly
 *  - _automatic_ (`useAsync.DEEP` or `useAsync.SHALLOW`) - the function is triggered initially
 * and then automatically when argument values change (using a shallow or deep comparison).
 *
 * For mutations you usually want _manual_ as it is triggered in response to some user action
 * like pressing a button.
 *
 * For data fetching you usually want _automatic_ mode as you retrieve some data
 * initially and then refetch it when some arguments change (eg. the id for a single
 * record or the filters for a list).
 *
 * > INFO
 * > **Which Hook to Use?**
 * >
 * > There are 3 async hooks provided that serve slightly different purposes.
 * >
 * > * [useAsyncListing](doc:useAsyncListing) is useful when you are dealing with a paginated list of data. It can optionally accumulate pages to implement infinite scroll.
 * > * [useAsyncValue](doc:useAsyncValue) can be used to resolve value(s) from an identifier, optionally reading from a cache. For example if you had a form `select` widget that read the available options from the server but on initial render you needed to make sure the previously selected values were known you could use `useAsyncValue`.
 * > * [useAsync](doc:useAsync) is used by the other two functions and is generic in its usage. You can use it to call any async function and then it's up to you what to do with the response.
 * >
 * > If in doubt just use [useAsync](doc:useAsync). Anything you can do with the other hooks can be done with `useAsync` -
 * > you may just have to write a bit more code.
 *
 * ## Usage
 *
 * The simplest usage is to just pass a function. This will only be called when  `run` is explicitly called:
 *
 * ```js
 * const { result, error, run } = useAsync(() => doSomething(arg1, arg2))
 * ```
 *
 * To run this automatically on mount and then whenever `arg1` or `arg2` change it could be refactored as:
 *
 * ```js
 * const { result, error } = useAsync(doSomething, { args: [arg1, arg2], trigger: useAsync.SHALLOW });
 * ```
 *
 * If `arg1` or `arg2` were objects that would fail a shallow equality check (`oldArg1 !== arg1`) then use
 * `useAsync.DEEP`
 *
 * ```js
 * // this will result in the call `doSomething([1, 2, 3])`. As the array is constructed every
 * // render this will always fail shallow equality checks.
 * const arg1 = [1, 2, 3];
 * const { result, error } = useAsync(doSomething, { args: [arg1], trigger: useAsync.DEEP });
 * ```
 *
 * See the [interactive examples](#Examples) at the bottom of the page for more complete examples.
 *
 * @param fn A function that returns a promise. When `trigger` is `MANUAL` this is only
 * called when you manually call the returned `run` function, otherwise it's called
 * initially and then whenever an equality comparison fails between previous arguments and new
 * arguments.
 *
 * Note that when `trigger` is `SHALLOW` or `DEEP` then any changes to this function will
 * cause it to be called again. If you need to pass a function defined inline in your component
 * or hook you must memoize it (eg. with `useCallback`).  A better approach is to pass a
 * stable function and use `options.args` instead:
 *
 * ```js
 * // This will result in an infinite loop; the arrow function changes every render
 * useAsync(() => myFn(1, 2, 3), { trigger: useAsync.SHALLOW })
 *
 * // `myFn` is constant and so won't change; `useAsync` will compare args every render and only call `myFn` when they change
 * useAsync(myFn, { args: [1, 2, 3], trigger: useAsync.SHALLOW })
 * ```
 *
 * **NOTE:** To help detect runaway effects caused by this automatically consider using
 * [stop-runaway-react-effects](https://github.com/kentcdodds/stop-runaway-react-effects).
 *
 * @template ResultT The type of the value returned from `fn` on success
 * @template ErrorT The type of the error value when `fn` rejects
 *
 * @extract-docs
 */
function useAsync<ResultT, ErrorT = Error>(
    fn: AsyncFunction<ResultT>,
    options: UseAsyncOptions<ResultT, ErrorT> = {}
): UseAsyncReturnObject<ResultT, ErrorT> {
    const { trigger = MANUAL, args = [], onSuccess, onError } = options;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [{ id, ...state }, dispatch] = useReducer<
        (
            state: ReducerState<ResultT, ErrorT>,
            action: ReducerAction<ResultT, ErrorT>
        ) => ReducerState<ResultT, ErrorT>
    >(reducer, {
        isLoading: trigger !== MANUAL,
        error: null,
        result: null,
    });

    // =========================================================================
    // Validate parameters
    const invalidOptionKeys = Object.keys(options).filter(key => !validOptionKeys.includes(key));
    if (invalidOptionKeys.length > 0) {
        throw new Error(
            `Invalid options specified: ${invalidOptionKeys.join(
                ', '
            )}. Valid options are: ${validOptionKeys.join(', ')}`
        );
    }
    if (options && !isPlainObject(options)) {
        throw new Error(`Options must be an object, received ${options}`);
    }
    if (args && !Array.isArray(args)) {
        throw new Error(
            `The 'args' option must be an array of arguments to pass to the async function. If you are trying to pass a single argument wrap it in an array, eg. '[<arg>]'. Received type: ${typeof args}`
        );
    }
    if (![SHALLOW, MANUAL, DEEP].includes(trigger)) {
        throw new Error(`Invalid trigger ${trigger}`);
    }
    // =========================================================================

    const comparisonFn = comparisonByTrigger[trigger];
    const memoizedArgs = useMemoOne(() => args, args, comparisonFn);
    // We cache the lastValues so we can read them when run() is called. This allows
    // us to accept values that change every render in calls to useAsync when trigger
    // of MANUAL is used (eg. inline arrow functions). Because we read the values at
    // call time they don't need to be deps of the `useCallback` call and as such is
    // not constantly re-created.
    const l = {
        fn,
        onSuccess,
        onError,
        args,
    };
    const lastValues = useRef(l);
    lastValues.current = l;

    const callId = useRef(0);
    // =========================================================================
    // This is the function that gets called to fire the async function. It's
    // either called manually by the consumer calling the returned 'run' function
    // or internally on mount and on any subsequent args changed when trigger
    // is not MANUAL.
    // Note that this function is never recreated - it's cached once with
    // useCallback and from that point on should have consistent identity.
    // It either gets passed the arguments or reads then from a ref at call time.
    const execute = useCallback((
        executeFn,
        executeArgs,
        // When execute is called read the current value for onSuccess and
        // onError. This allows for nicer ergonomics by allowing inline
        // arrow functions to be passed without triggering the function
        // when trigger is not MANUAL. Without doing it this way it would
        // need to be a dependency on the initial fetch useEffect below and
        // as such would trigger a re-execute whenever it changed.
        executeOnSuccess = lastValues.current.onSuccess,
        executeOnError = lastValues.current.onError
    ): [Promise<any>, () => void] => {
        let isCurrent = true;
        const currentCallId = callId.current;
        callId.current += 1;
        // Avoid possibility of overflow
        if (callId.current > 100000) {
            callId.current = 0;
        }
        dispatch({ type: 'start', id: currentCallId });
        const promise = executeFn(...executeArgs);
        if (!isPromise(promise)) {
            const message = 'useAsync can only be used with functions that return a Promise. Got: ';
            // eslint-disable-next-line no-console
            console.error(message, promise);
            throw new Error(message);
        }
        promise.then(
            result => {
                if (!isCurrent) {
                    return;
                }
                dispatch({ type: 'success', payload: result });
                if (executeOnSuccess) {
                    executeOnSuccess(result);
                }
            },
            e => {
                if (!isCurrent) {
                    return;
                }
                dispatch({ type: 'error', payload: e });
                if (executeOnError) {
                    executeOnError(e);
                }
            }
        );
        return [
            promise,
            (): void => {
                dispatch({ type: 'abort', id: currentCallId });
                isCurrent = false;
            },
        ];
    }, []);
    // =========================================================================

    // abortRef is used by execute to store an abort function so that if the
    // component unmounts before the async function finishes running then it
    // can avoid calling success / error functions that would set state.
    const abortRef = useRef<(() => void) | null>();

    // =========================================================================
    // Effect to trigger the execute method when:
    // 1) Parameters change
    // 2) The actual function changes
    // 3) The trigger changes from MANUAL
    const isManual = trigger === MANUAL;
    useEffect(() => {
        if (isManual) {
            return noop;
        }
        const [, abort] = execute(fn, memoizedArgs);
        if (abortRef.current) {
            abortRef.current();
        }
        abortRef.current = abort;
        return abort;
    }, [fn, memoizedArgs, isManual, execute]);
    // =========================================================================

    // =========================================================================
    // This effect tracks mount status and executes a cached callback (abortRef)
    // when unmounting occurs.
    const isMounted = useRef(true);
    useEffect(() => {
        return (): void => {
            isMounted.current = false;
            if (abortRef.current) {
                abortRef.current();
            }
        };
    }, []);
    // =========================================================================

    // =========================================================================
    // Create callback that is returned and can be called by the consumer. This
    // just calls `execute` but optionally supports changing the arguments it
    // is called with (if arguments are passed they override `args`, otherwise
    // `args` is used).
    const run = useCallback(
        (...executeArgs) => {
            if (!isMounted.current) {
                const message =
                    "useAsync 'run' method was called after component was unmounted. This has no effect. If you are calling it in the response of a promise then ensure the component is still mounted otherwise call the function directly and don't use useAsync.";
                // eslint-disable-next-line no-console
                console.warn(message);
                return Promise.reject(message);
            }
            if (executeArgs.length === 0) {
                executeArgs = lastValues.current.args;
            }
            const [promise, abort] = execute(lastValues.current.fn, executeArgs);
            // If we have a pending previous call abort it. This maintains
            // consistency with the other way `execute` is called (see
            // useEffect above that returns an `abort` function).
            if (abortRef.current) {
                abortRef.current();
            }
            abortRef.current = abort;
            return promise;
        },
        [execute]
    );
    // =========================================================================

    // =========================================================================
    // Reset should abort any current calls (which means the onSuccess/onError
    // won't be called) and reset result, error and isLoading back to initial
    // values
    const reset = useCallback(() => {
        if (abortRef.current) {
            abortRef.current();
            abortRef.current = null;
        }
        dispatch({ type: 'reset' });
    }, []);
    // =========================================================================

    return useMemo(
        () => ({
            ...state,
            reset,
            run,
            get response(): typeof state.result {
                console.warn("'response' has been renamed to 'result' - please update usage");
                return state.result;
            },
        }),
        [run, state, reset]
    );
}

useAsync.MANUAL = MANUAL;
useAsync.DEEP = DEEP;
useAsync.SHALLOW = SHALLOW;

export default useAsync as typeof useAsync & {
    readonly MANUAL: typeof MANUAL;
    readonly DEEP: typeof DEEP;
    readonly SHALLOW: typeof SHALLOW;
};
