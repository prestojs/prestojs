// TODO: These need to move to another module
import {
    useAsyncLookup,
    UseAsyncLookupProps,
    UseAsyncLookupReturn,
    useAsyncValue,
    UseAsyncValueReturn,
} from '@prestojs/rest';
import { Id } from '@prestojs/util/';
import { AsyncChoicesInterface } from './fields/AsyncChoices';

type UseAsyncChoicesProps<ItemT, ValueT> = Pick<
    UseAsyncLookupProps<ValueT>,
    'accumulatePages' | 'query' | 'trigger'
> & {
    asyncChoices: AsyncChoicesInterface<ItemT, ValueT>;
    value?: ValueT;
};

type Unwrap<T> = T extends Array<infer U> ? U : T;

type UseAsyncChoicesReturn<ItemT, ValueT> = {
    list: UseAsyncLookupReturn<Unwrap<ItemT>[]>;
    selected: UseAsyncValueReturn<ItemT>;
    choices: ReturnType<AsyncChoicesInterface<ItemT, ValueT>['getChoices']>;
};
export default function useAsyncChoices<ItemT, ValueT>({
    asyncChoices,
    value,
    trigger,
    query,
    accumulatePages,
}: UseAsyncChoicesProps<ItemT, ValueT>): UseAsyncChoicesReturn<ItemT, ValueT> {
    const listDeps = asyncChoices.useListDeps({});
    const list = useAsyncLookup<Unwrap<ItemT>[]>({
        trigger,
        query,
        accumulatePages,
        execute: props => asyncChoices.list(props, listDeps),
        paginator: listDeps?.paginator,
    });
    const retrieveDeps = asyncChoices.useRetrieveDeps({});
    // Haven't been able to workout typing on this yet
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const selected = useAsyncValue({
        existingValues: list.result,
        ids: Array.isArray(value) ? value : undefined,
        id: !Array.isArray(value) ? value : undefined,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        resolve: props => asyncChoices.retrieve(props, retrieveDeps),
    });
    return {
        list,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        selected,
        choices: asyncChoices.getChoices(list.result || []),
    };
}
