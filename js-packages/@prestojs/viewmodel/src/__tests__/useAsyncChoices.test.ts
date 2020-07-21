import { PageNumberPaginator, usePaginator } from '@prestojs/util';
import { act, renderHook } from '@testing-library/react-hooks';
import AsyncChoices from '../fields/AsyncChoices';
import CharField from '../fields/CharField';
import useAsyncChoices from '../useAsyncChoices';
import useViewModelCache from '../useViewModelCache';
import viewModelFactory from '../ViewModelFactory';

type TestDataItem = { label: string; id: number; _key: number };
const testData: TestDataItem[] = Array.from({ length: 20 }, (_, i) => ({
    label: `Item ${i}`,
    id: i,
    get _key(): number {
        return this.id;
    },
}));
const getLabel = (item): string => item.label;
const getValue = (item): number => item.id;
function list(props: {
    query: Record<string, any>;
    paginator?: PageNumberPaginator;
}): Promise<TestDataItem[]> {
    let { paginator, query = {} } = props;
    if (paginator) {
        query = paginator.getRequestInit({ query }).query as Record<string, any>;
    }
    const pageSize = Number(query.pageSize || 10);
    let page = Number(query.page || 1);
    let filteredData = testData;
    if (query.keywords) {
        filteredData = filteredData.filter(item =>
            query.exact ? item.label === query.keywords : item.label.includes(query.keywords)
        );
    }
    const results = filteredData.slice(pageSize * (page - 1), pageSize * page);
    if (paginator) {
        (paginator as PageNumberPaginator).setResponse({
            total: filteredData.length,
            pageSize,
        });
    }
    return Promise.resolve(results);
}
const retrieve = (i: number): Promise<TestDataItem> => Promise.resolve(testData[i]);
const baseOptions = {
    multiple: false,
    list,
    retrieve,
    getLabel,
    getValue,
};

test('useAsyncChoices should support basic usage', async () => {
    const asyncChoices = new AsyncChoices(baseOptions);
    const { rerender, result, waitForNextUpdate } = renderHook(
        ({ value }: { value?: null | number }) =>
            useAsyncChoices({
                asyncChoices,
                value,
            }),
        { initialProps: { value: null } }
    );
    expect(result.current.list.isLoading).toBe(true);
    expect(result.current.selected.isLoading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.choices).toEqual(
        testData.slice(0, 10).map(({ label, id }) => ({ value: id, label }))
    );
    expect(result.current.list.isLoading).toBe(false);
    rerender({ value: 3 });
    // Changing value shouldn't result in any loading changes as we already have the value
    expect(result.current.list.isLoading).toBe(false);
    expect(result.current.selected.isLoading).toBe(false);
    expect(result.current.selected.value).toEqual(testData[3]);
    // 15 is outside of the fetched data so should trigger a fetch
    rerender({ value: 15 });
    expect(result.current.list.isLoading).toBe(false);
    expect(result.current.selected.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.list.isLoading).toBe(false);
    expect(result.current.selected.isLoading).toBe(false);
    expect(result.current.selected.value).toEqual(testData[15]);
});

test('useAsyncChoices should support hooking up to ViewModelCache easily', async () => {
    const ItemModel = viewModelFactory({
        label: new CharField(),
    });
    type ItemModelInstance = InstanceType<typeof ItemModel>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = testData.map(({ _key, ...item }) => ItemModel.cache.add(item));
    const list = (): Promise<ItemModelInstance[]> => Promise.resolve(data.slice(0, 10));
    const retrieve = (i: number): Promise<ItemModelInstance> => Promise.resolve(data[i]);
    const asyncChoices = new AsyncChoices({
        multiple: false,
        list,
        retrieve,
        getLabel,
        getValue,
        useResolveItems<T extends ItemModelInstance | ItemModelInstance[] | null>(item: T): T {
            return useViewModelCache<ItemModelInstance, T>(ItemModel, cache => {
                if (item == null) {
                    return item;
                }
                return Array.isArray(item) ? cache.getList(item) : cache.get(item) || item;
            });
        },
    });
    const { rerender, result, waitForNextUpdate } = renderHook(
        ({ value }: { value?: null | number }) =>
            useAsyncChoices({
                asyncChoices,
                value,
            }),
        { initialProps: { value: null } }
    );
    expect(result.current.list.isLoading).toBe(true);
    expect(result.current.selected.isLoading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.choices).toEqual(
        testData.slice(0, 10).map(({ label, id }) => ({ value: id, label }))
    );
    rerender({ value: 3 });
    expect(result.current.list.isLoading).toBe(false);
    expect(result.current.selected.isLoading).toBe(false);
    expect(result.current.selected.value).toEqual(data[3]);
    // Updating the cached record should reflect in the selected data
    const next = new ItemModel({ id: 3, label: 'new label' });
    act(() => {
        ItemModel.cache.add(next);
    });
    expect(result.current.selected.value).toEqual(next);
    expect(result.current.choices).toEqual(
        testData
            .slice(0, 10)
            .map(({ label, id }) => ({ value: id, label: id === 3 ? 'new label' : label }))
    );
});

test('useAsyncChoices should support useListProps', async () => {
    const asyncChoices = new AsyncChoices({
        ...baseOptions,
        list,
        useListProps(): { paginator: PageNumberPaginator } {
            const paginator = usePaginator(PageNumberPaginator);
            return { paginator };
        },
    });
    const { result, waitForNextUpdate } = renderHook(
        ({ value }: { value?: null | number }) =>
            useAsyncChoices({
                asyncChoices,
                value,
            }),
        { initialProps: { value: null } }
    );
    expect(result.current.list.isLoading).toBe(true);
    expect(result.current.selected.isLoading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.choices).toEqual(
        testData.slice(0, 10).map(({ label, id }) => ({ value: id, label }))
    );
    act(() => {
        result.current.list.paginator?.next();
    });
    expect(result.current.list.isLoading).toBe(true);
    expect(result.current.selected.isLoading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.choices).toEqual(
        testData.slice(10).map(({ label, id }) => ({ value: id, label }))
    );
});

test('useAsyncChoices should support accumulatePages', async () => {
    const asyncChoices = new AsyncChoices({
        ...baseOptions,
        list,
        useListProps(): { paginator: PageNumberPaginator } {
            const paginator = usePaginator(PageNumberPaginator);
            return { paginator };
        },
    });
    const { result, waitForNextUpdate } = renderHook(
        ({ value }: { value?: null | number }) =>
            useAsyncChoices({
                asyncChoices,
                value,
                accumulatePages: true,
            }),
        { initialProps: { value: null } }
    );
    expect(result.current.list.isLoading).toBe(true);
    expect(result.current.selected.isLoading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.choices).toEqual(
        testData.slice(0, 10).map(({ label, id }) => ({ value: id, label }))
    );
    act(() => {
        result.current.list.paginator?.next();
    });
    expect(result.current.list.isLoading).toBe(true);
    expect(result.current.selected.isLoading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.choices).toEqual(testData.map(({ label, id }) => ({ value: id, label })));
});

test('useAsyncChoices should support query', async () => {
    const asyncChoices = new AsyncChoices(baseOptions);
    const { rerender, result, waitForNextUpdate } = renderHook(
        ({ value, query }: { value?: null | number; query: Record<string, any> }) =>
            useAsyncChoices({
                asyncChoices,
                value,
                query,
            }),
        { initialProps: { value: null, query: {} } }
    );
    expect(result.current.list.isLoading).toBe(true);
    expect(result.current.selected.isLoading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.choices).toEqual(
        testData.slice(0, 10).map(({ label, id }) => ({ value: id, label }))
    );
    rerender({ query: { keywords: 'Item 1' } });
    expect(result.current.list.isLoading).toBe(true);
    expect(result.current.selected.isLoading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.choices).toEqual(
        [testData[1], ...testData.slice(10, 19)].map(({ label, id }) => ({ value: id, label }))
    );
    rerender({ query: { keywords: 'Item 1', exact: true } });
    expect(result.current.list.isLoading).toBe(true);
    expect(result.current.selected.isLoading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.choices).toEqual([
        {
            label: 'Item 1',
            value: 1,
        },
    ]);
});
