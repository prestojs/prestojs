import { useReducer, useLayoutEffect, useRef } from 'react';

import { ViewModelClass } from './typeUtil';
import ViewModel from './ViewModel';
import ViewModelCache from './ViewModelCache';

type Selector<T extends ViewModel<any>, ResultType> = (cache: ViewModelCache<T>) => ResultType;

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
 * @param viewModel The ViewModel to use the cache from
 * @param selector A function that gets passed the cache and selects data from it. If your selector
 * is slow consider using a library like [reselect](https://github.com/reduxjs/reselect) to create
 * your selector with. Note that `get`, `getAll` and `getList` on `ViewModelCache` will return the
 * same object across multiple calls if the underlying data has not changed.
 *
 * @returns The data as returned by `selector`
 */
export default function useViewModelCache<T extends ViewModel<any>, ResultType>(
    viewModel: ViewModelClass<T>,
    selector: Selector<T, ResultType>
): ResultType {
    // Implementation is based on https://github.com/reduxjs/react-redux/blob/master/src/hooks/useSelector.js
    const [, forceRender] = useReducer(i => !i, true);
    const latestSubscriptionCallbackError = useRef<Error>();
    const lastSelector = useRef<Selector<T, ResultType>>();
    const lastValue = useRef<ResultType>();
    let value;

    try {
        if (lastSelector.current !== selector || latestSubscriptionCallbackError.current) {
            value = selector(viewModel.cache);
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
    });

    useLayoutEffect(() => {
        function checkForUpdates(): void {
            try {
                // lastSelector.current is always set... ignore typescript
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                const nextValue = lastSelector.current(viewModel.cache);
                if (nextValue === lastValue.current) {
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
    }, [viewModel.cache]);

    return value;
}
