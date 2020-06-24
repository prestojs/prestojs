import {
    isDeepEqual,
    useAsyncLookup,
    UseAsyncLookupProps,
    UseAsyncLookupReturn,
    useAsyncValue,
    UseAsyncValueReturn,
    useMemoOne,
} from '@prestojs/util';
import { AsyncChoicesInterface } from './fields/AsyncChoices';

/**
 * @expand-properties
 */
type UseAsyncChoicesProps<ItemT, ValueT, Mult extends boolean> = Pick<
    UseAsyncLookupProps<ItemT[]>,
    'accumulatePages' | 'query' | 'trigger'
> & {
    /**
     * See [AsyncChoices](doc:AsyncChoices]
     */
    asyncChoices: AsyncChoicesInterface<ItemT, ValueT, Mult>;
    /**
     * The currently selected choice(s) - if any
     *
     * When specified the corresponding label(s) will be resolved
     * automatically.
     */
    value?: (Mult extends true ? ValueT[] : ValueT) | null;
    /**
     * If provided this function will be called whenever a value is successfully
     * resolved using `asyncChoices.retrieve`.
     */
    onRetrieveSuccess?: (response: Mult extends true ? ItemT[] : ItemT) => void;
    /**
     * If provided this function will be called whenever `asyncChoices.retrieve` errors
     *
     * You can use this to do things like unset a value if it no longer exists.
     */
    onRetrieveError?: (error: Error) => void;
    /**
     * Any extra options to pass through to [list](doc:AsyncChoicesInterface#method-list)
     *
     * These will be available in both [useListDeps](doc:AsyncChoicesInterface#method-list) and [list](doc:AsyncChoicesInterface#method-useListDeps) under the `listOptions`
     * key
     */
    listOptions?: Record<string, any>;
    /**
     * Any extra options to pass through to [retrieve](doc:AsyncChoicesInterface#method-retrieve)
     *
     * These will be available in both [useRetrieveDeps](doc:AsyncChoicesInterface#method-retrieve) and [retrieve](doc:AsyncChoicesInterface#method-useRetrieveDeps) under the `retrieveOptions`
     * key
     */
    retrieveOptions?: Record<string, any>;
};

/**
 * @expand-properties
 */
type UseAsyncChoicesReturn<ItemT, ValueT, Mult extends boolean> = {
    /**
     * See [useAsyncLookup](doc:useAsyncLookup#return-type)
     */
    list: UseAsyncLookupReturn<ItemT[]>;
    /**
     * See [useAsyncValue](doc:useAsyncValue#return-type)
     */
    selected: UseAsyncValueReturn<Mult extends true ? ItemT[] : ItemT>;
    /**
     * See [getChoices](doc:AsyncChoicesInterface#method-getChoices)
     */
    choices: ReturnType<AsyncChoicesInterface<ItemT, ValueT, Mult>['getChoices']>;
};

/**
 * Hook that makes it easy to use an [AsyncChoices](doc:AsyncChoicesInterface) definition.
 *
 * This hook does the following:
 *
 * 1) Calls [useListDeps](doc:AsyncChoicesInterface#method-useListDeps) to get any dependencies for [list](doc:AsyncChoicesInterface#method-list)
 *
 * 2) Calls [list](doc:AsyncChoicesInterface#method-list) and passes through the dependencies and a `query` object representing any query parameters for the async call
 *
 * 3) Calls [useRetrieveDeps](doc:AsyncChoicesInterface#method-useRetrieveDeps) to get any dependencies for [retrieve](doc:AsyncChoicesInterface#method-retrieve)
 *
 * 4) If there is a current `value` [retrieve](doc:AsyncChoicesInterface#method-retrieve) is called and is passed the dependencies returned above
 *
 * 5) An object is returned with the available choices in `choices`, the result of 2 in `list` and result of 4 in `selected`
 *
 * @extract-docs
 * @menu-group Async Choices
 */
export default function useAsyncChoices<ItemT, ValueT, Mult extends boolean>(
    props: UseAsyncChoicesProps<ItemT, ValueT, Mult>
): UseAsyncChoicesReturn<ItemT, ValueT, Mult> {
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
    const listDeps = asyncChoices.useListDeps({
        value,
        query,
        listOptions,
    });
    const execute = useMemoOne(
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        () => props => asyncChoices.list({ value, ...props, ...listDeps, listOptions }),
        [asyncChoices],
        isDeepEqual
    );
    const list = useAsyncLookup<ItemT[]>({
        trigger,
        query,
        accumulatePages: listDeps?.paginator ? accumulatePages : false,
        execute,
        paginator: listDeps?.paginator,
    });
    const retrieveDeps =
        asyncChoices.useRetrieveDeps({
            ids: Array.isArray(value) ? value : undefined,
            id: !Array.isArray(value) ? value : undefined,
            retrieveOptions,
        }) || {};
    const resolve = useMemoOne(
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        () => props => asyncChoices.retrieve(props, retrieveDeps),
        [asyncChoices, retrieveDeps],
        isDeepEqual
    );
    const { existingValues } = retrieveDeps;
    const selected = useAsyncValue({
        existingValues: existingValues || list.result,
        // Haven't been able to workout typing on this yet
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        ids: Array.isArray(value) ? value : undefined,
        id: !Array.isArray(value) ? value : undefined,
        resolve,
        onError: onRetrieveError,
        onSuccess: onRetrieveSuccess,
    });
    return {
        list,
        selected,
        choices: asyncChoices.getChoices(list.result || []),
    };
}
