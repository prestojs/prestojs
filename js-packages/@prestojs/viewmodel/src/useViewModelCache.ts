import { useMemoOne } from '@prestojs/util';
import { useCallback, useDebugValue, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import ViewModelCache from './ViewModelCache';
import { ViewModelConstructor } from './ViewModelFactory';

/**
 * @typeParam ViewModelType {@inheritTypeParam useViewModelCache}
 * @typeParam ResultType {@inheritTypeParam useViewModelCache}
 * @typeParam SelectorArgs {@inheritTypeParam useViewModelCache}
 */
export interface ViewModelCacheSelector<
    ViewModelType extends ViewModelConstructor<any, any>,
    ResultType,
    SelectorsArgs extends any[]
> {
    /**
     * A function that takes a cache, and any arguments passed to `useViewModelCache`, and returns a value.
     *
     * @param cache The cache to get the value from
     * @param args The arguments that were passed to `useViewModelCache`
     */
    (cache: ViewModelCache<ViewModelType>, ...args: SelectorsArgs): ResultType;
}

function defaultEquality<T>(currentValue: T, previousValue?: T): boolean {
    return currentValue === previousValue;
}

/**
 * The `useViewModelCache` React hook provides an easy way to interact with your ViewModel cache. This hook triggers a
 * re-render of your component whenever the associated cache data changes, ensuring your component always displays the
 * most recent data.
 *
 * <Alert type="info">See the [ViewModel getting started guide](/docs/getting-started/viewmodel) for an overview of ViewModel's and how caching works</Alert>
 *
 * <Usage>
 *
 *     The `useViewModelCache` hook takes a `ViewModel` class as the first argument and a selector function as the second argument.
 *     The selector function returns the data you want from the cache and is called whenever the cache changes.
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
 * Selectors can return anything
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
 * <Alert type="info">
 *     Note that if the selector returns the same object as the previous call then no re-render will be triggered. If
 *     you are returning values direct from the cache (e.g. by calling `get` or `getList`) then you don't need to do
 *     anything special, but if you are transforming the value in any way it's a good idea to ensure the transformed
 *     objects are only re-created when something changes.
 * </Alert>
 *
 * </Usage>
 *
 * @param viewModel The ViewModel to use the cache from
 * @param selector A function that gets passed the cache and selects data from it.  Note that `get`, `getAll` and
 * `getList` on `ViewModelCache` will return the same object across multiple calls if the underlying data has not
 * changed.
 * @param args Any extra arguments to pass through to the selector. These will be compared shallowly
 * and any changes will re-run the selector.
 * @param isEquals Optionally control how equality is determined for an object. By default this is
 * a strict equality check. This is useful as an optimisation when you want the value returned from
 * a selector to be the same object when the selector re-runs.
 *
 * @returns The data as returned by `selector`
 *
 * @extractdocs
 * @menugroup Caching
 * @typeParam ViewModelType The type of the ViewModel to use the cache from
 * @typeParam ResultType The type of the result returned by the selector
 * @typeParam SelectorArgs The type of the arguments passed to the selector
 */
export default function useViewModelCache<
    ViewModelType extends ViewModelConstructor<any, any>,
    ResultType,
    SelectorArgs extends any[] = any[]
>(
    viewModel: ViewModelType,
    selector: ViewModelCacheSelector<ViewModelType, ResultType, SelectorArgs>,
    args: SelectorArgs = [] as any,
    isEquals: (currentValue: ResultType, previousValue?: ResultType) => boolean = defaultEquality
): ResultType {
    // ViewModelCache internally is mutable, but the data returned for each record is immutable. This means there's
    // no one thing we can return from the cache that indicates something has changed. Instead, we use this ref to
    // track "new" version of cache which we can pass to `getSnapshot` below. We update this ref whenever the
    // cache changes.
    const latest = useRef({ cache: viewModel.cache });
    const wrappedSelector = useMemoOne(
        () =>
            ({ cache }: { cache: ViewModelCache<ViewModelType> }) =>
                selector(cache, ...args),
        [selector, args]
    );
    const selectedState = useSyncExternalStoreWithSelector(
        useCallback(
            callback => {
                return viewModel.cache.addListener(() => {
                    latest.current = { cache: viewModel.cache };
                    callback();
                });
            },
            [viewModel.cache]
        ),
        () => latest.current,
        () => latest.current,
        wrappedSelector,
        isEquals
    );

    useDebugValue(selectedState);

    return selectedState;
}
