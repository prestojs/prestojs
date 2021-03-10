import { useDebugValue, useLayoutEffect, useReducer, useRef } from 'react';

import ViewModelCache from './ViewModelCache';
import { ViewModelConstructor } from './ViewModelFactory';

type Selector<T extends ViewModelConstructor<any, any>, ResultType, U extends any[]> = (
    cache: ViewModelCache<T>,
    ...args: U
) => ResultType;

function shallowEqual(a?: any[], b?: any[]): boolean {
    if (a === b) {
        return true;
    }
    if (!a || !b) {
        return false;
    }
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

function defaultEquality<T>(currentValue: T, previousValue?: T): boolean {
    return currentValue === previousValue;
}

/**
 * Select some data out of the cache for use in a component. Whenever the cache data
 * changes the component will re-render with latest value.
 *
 * Example usage:
 *
 * ```jsx
 * function UserView({ id }) {
 *     const record = useViewModelCache(User, cache => cache.get(id, ['firstName']));
 *
 *     return <div>Welcome {record.firstName}</div>;
 * }
 * ```
 *
 * Extra arguments can be passed through as a third argument to the selector which makes
 * it easier to create reusable selectors. We could rewrite the above like:
 *
 * ```jsx
 * const selectUser = (cache, id, fieldNames) => cache.get(id, fieldNames);
 * function UserView({ id }) {
 *     const record = useViewModelCache(User, selectUser, [id, fieldNames]);
 *
 *     return <div>Welcome {record.firstName}</div>;
 * }
 * ```
 *
 * Selectors can return anything:
 *
 * ```jsx
 * const usersByGroup = cache => cache.getAll(['groupId', 'firstName', 'email']).reduce((acc, record) => {
 *   acc[record.groupId] = acc[record.firstName] || [];
 *   acc[record.groupId].push(record);
 *   return acc;
 * }, {})
 * function GroupedUserView() {
 *   const groupedUsers = useViewModelCache(User, usersByGroup);
 *   return ...
 * }
 * ```
 *
 * In the preceding example the object returned from `useViewModelChange` will change each time `GroupUserView`
 * renders. This is because the selector returns a new object every time and internally `useViewModelChange`
 * does a strict equality check to determine whether to return the new value or keep the old value. As an
 * optimisation you can pass a third parameter that defines how to compare the previous and current value:
 *
 * ```jsx
 * import isEqual from 'lodash/isEqual';
 *
 * function OptimisedGroupedUserView() {
 *   // isEqual does a deep equality check so if the underlying cached values remain the same then the
 *   // object returned here will be the same across multiple renders.
 *   const groupedUsers = useViewModelCache(User, usersByGroup, [], isEqual);
 *   return ...
 * }
 * ```
 *
 * @param viewModel The ViewModel to use the cache from
 * @param selector A function that gets passed the cache and selects data from it. If your selector
 * is slow consider using a library like [reselect](https://github.com/reduxjs/reselect) to create
 * your selector with. Note that `get`, `getAll` and `getList` on `ViewModelCache` will return the
 * same object across multiple calls if the underlying data has not changed.
 * @param args Any extra arguments to pass through to the selector. These will be compared shallowly
 * and any changes will re-run the selector.
 * @param isEquals Optionally control how equality is determined for an object. By default this is
 * a strict equality check. This is useful as an optimisation when you want the value returned from
 * a selector to be the same object when the selector re-runs.
 *
 * @returns The data as returned by `selector`
 *
 * @extract-docs
 * @menu-group Caching
 */
export default function useViewModelCache<
    T extends ViewModelConstructor<any, any>,
    ResultType,
    U extends any[] = any[]
>(
    viewModel: T,
    selector: Selector<T, ResultType, U>,
    args: U = [] as any,
    isEquals: (currentValue: ResultType, previousValue?: ResultType) => boolean = defaultEquality
): ResultType {
    // Implementation is based on https://github.com/reduxjs/react-redux/blob/master/src/hooks/useSelector.js
    const [, forceRender] = useReducer<React.Reducer<boolean, {}>>(i => !i, true);
    const latestSubscriptionCallbackError = useRef<Error>();
    const lastSelector = useRef<Selector<T, ResultType, U>>();
    const lastValue = useRef<ResultType>();
    const lastArgs = useRef<U>();
    let value;

    try {
        if (args == null) {
            args = [] as any;
        }
        if (
            lastSelector.current !== selector ||
            latestSubscriptionCallbackError.current ||
            !shallowEqual(lastArgs.current, args)
        ) {
            value = selector(viewModel.cache, ...args);
        } else {
            value = lastValue.current;
        }
    } catch (err) {
        if (latestSubscriptionCallbackError.current) {
            err.message += `\nThe error may be correlated with this previous error:\n${latestSubscriptionCallbackError.current.stack}\n\n`;
        }

        throw err;
    }

    useLayoutEffect(() => {
        lastSelector.current = selector;
        lastValue.current = value;
        lastArgs.current = args;
    });

    useLayoutEffect(() => {
        function checkForUpdates(): void {
            try {
                // lastSelector.current is always set... ignore typescript
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const nextValue = lastSelector.current(viewModel.cache, ...lastArgs.current);
                if (isEquals(nextValue, lastValue.current)) {
                    return;
                }

                lastValue.current = nextValue;
            } catch (err) {
                latestSubscriptionCallbackError.current = err;
            }
            forceRender({});
        }

        // This catches any changes to cache that occur between initial render
        // and when the subscription is added here
        // See "should handle updates between first render and subscription" test case
        checkForUpdates();

        return viewModel.cache.addListener(checkForUpdates);
    }, [isEquals, viewModel.cache]);

    useDebugValue(value);

    return value;
}
