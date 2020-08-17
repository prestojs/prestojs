import {
    isDeepEqual,
    useAsyncListing,
    UseAsyncListingProps,
    UseAsyncListingReturn,
    useAsyncValue,
    UseAsyncValueReturn,
    useMemoOne,
} from '@prestojs/util';
import { AsyncChoicesInterface } from './fields/AsyncChoices';

/**
 * @expand-properties
 */
type UseAsyncChoicesProps<ItemT, ValueT> = Pick<
    UseAsyncListingProps<ItemT[]>,
    'accumulatePages' | 'query' | 'trigger'
> & {
    /**
     * See [AsyncChoices](doc:AsyncChoices]
     */
    asyncChoices: AsyncChoicesInterface<ItemT, ValueT>;
    /**
     * The currently selected choice(s) - if any
     *
     * When specified the corresponding label(s) will be resolved
     * automatically.
     */
    value?: ValueT[] | ValueT | null;
    /**
     * If provided this function will be called whenever a value is successfully
     * resolved using `asyncChoices.retrieve`.
     */
    onRetrieveSuccess?: (response: ItemT[] | ItemT) => void;
    /**
     * If provided this function will be called whenever `asyncChoices.retrieve` errors
     *
     * You can use this to do things like unset a value if it no longer exists.
     */
    onRetrieveError?: (error: Error) => void;
    /**
     * Any extra options to pass through to [list](doc:AsyncChoicesInterface#method-list)
     *
     * These will be available in both [useListProps](doc:AsyncChoicesInterface#method-list) and [list](doc:AsyncChoicesInterface#method-useListProps) under the `listOptions`
     * key
     */
    listOptions?: Record<string, any>;
    /**
     * Any extra options to pass through to [retrieve](doc:AsyncChoicesInterface#method-retrieve)
     *
     * These will be available in both [useRetrieveProps](doc:AsyncChoicesInterface#method-retrieve) and [retrieve](doc:AsyncChoicesInterface#method-useRetrieveProps) under the `retrieveOptions`
     * key
     */
    retrieveOptions?: Record<string, any>;
};

/**
 * @expand-properties
 */
type UseAsyncChoicesReturn<ItemT, ValueT> = {
    /**
     * See [useAsyncListing](doc:useAsyncListing#return-type)
     */
    list: UseAsyncListingReturn<ItemT[]>;
    /**
     * See [useAsyncValue](doc:useAsyncValue#return-type)
     */
    selected: UseAsyncValueReturn<ItemT[] | ItemT>;
    /**
     * See [getChoices](doc:AsyncChoicesInterface#method-getChoices)
     */
    choices: ReturnType<AsyncChoicesInterface<ItemT, ValueT>['getChoices']>;
};

/**
 * Hook that makes it easy to use an [AsyncChoices](doc:AsyncChoicesInterface) definition.
 *
 * This hook does the following:
 *
 * 1) Calls [useListProps](doc:AsyncChoicesInterface#method-useListProps) to get any dependencies for [list](doc:AsyncChoicesInterface#method-list)
 *
 * 2) Calls [list](doc:AsyncChoicesInterface#method-list) and passes through the dependencies and a `query` object representing any query parameters for the async call
 *
 * 3) Calls [useRetrieveProps](doc:AsyncChoicesInterface#method-useRetrieveProps) to get any dependencies for [retrieve](doc:AsyncChoicesInterface#method-retrieve)
 *
 * 4) If there is a current `value` [retrieve](doc:AsyncChoicesInterface#method-retrieve) is called and is passed the dependencies returned above
 *
 * 5) An object is returned with the available choices in `choices`, the result of 2 in `list` and result of 4 in `selected`
 *
 * @extract-docs
 * @menu-group Async Choices
 */
export default function useAsyncChoices<ItemT, ValueT>(
    props: UseAsyncChoicesProps<ItemT, ValueT>
): UseAsyncChoicesReturn<ItemT, ValueT> {
    const {
        asyncChoices,
        value,
        trigger,
        query,
        accumulatePages,
        onRetrieveError,
        onRetrieveSuccess,
        listOptions,
        retrieveOptions,
    } = props;
    const listProps = asyncChoices.useListProps({
        query,
        listOptions,
    });
    const execute = useMemoOne(
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        () => props => asyncChoices.list({ ...props, ...listProps, listOptions }),
        [listOptions, listProps, asyncChoices],
        isDeepEqual
    );
    const list = useAsyncListing<ItemT[]>({
        trigger,
        // If useListDeps has overridden query we should use it, otherwise default to original query
        query: listProps?.query ?? query,
        accumulatePages: listProps?.paginator ? accumulatePages : false,
        execute,
        paginator: listProps?.paginator,
    });
    const retrieveProps =
        asyncChoices.useRetrieveProps({
            ids: Array.isArray(value) ? value : undefined,
            id: !Array.isArray(value) ? value : undefined,
            existingValues: list.result,
            retrieveOptions,
        }) || {};
    const resolve = useMemoOne(
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        () => props => asyncChoices.retrieve(props, retrieveProps),
        [asyncChoices, retrieveProps],
        isDeepEqual
    );
    // If useRetrieveProps returns existingValues we use that otherwise use the value returned by list call
    // This allows overriding this behaviour from useRetrieveProps if necessary
    const { existingValues = list.result } = retrieveProps;
    const selected = useAsyncValue({
        existingValues: existingValues,
        // Haven't been able to workout typing on this yet
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        ids: Array.isArray(value) ? value : undefined,
        id: !Array.isArray(value) ? value : undefined,
        resolve,
        onError: onRetrieveError,
        onSuccess: onRetrieveSuccess,
    });
    const listResult = asyncChoices.useResolveItems(list.result);
    const selectedValue = asyncChoices.useResolveItems(selected.value);
    return {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        list: {
            ...list,
            result: listResult,
        },
        selected: {
            ...selected,
            value: selectedValue,
        },
        choices: asyncChoices.getChoices(listResult || []),
    };
}
