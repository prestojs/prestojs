import { act, renderHook } from 'presto-testing-library';
import PageNumberPaginator from '../pagination/PageNumberPaginator';
import usePaginator from '../pagination/usePaginator';
import useAsyncListing from '../useAsyncListing';

type TestDataItem = { name: string; pk: number };
const testData: TestDataItem[] = Array.from({ length: 20 }, (_, i) => ({
    name: `Item ${i}`,
    pk: i,
}));

function delay<T>(fn): Promise<T> {
    return new Promise((resolve, reject) => setTimeout(() => resolve(fn(reject))));
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function mockedPaginatedResponse({ query, paginator }): Promise<TestDataItem[]> {
    if (paginator) {
        query = paginator.getRequestInit({ query }).query;
    }
    const pageSize = Number(query.pageSize || 5);
    let page = Number(query.page || 1);
    if (query.last) {
        page = 4;
    }
    let filteredData = testData;
    if (query.search) {
        filteredData = filteredData.filter(item => item.name.includes(query.search));
    }
    const results = filteredData.slice(pageSize * (page - 1), pageSize * page);
    if (paginator) {
        (paginator as PageNumberPaginator).setResponse({ total: filteredData.length, pageSize });
    }
    return delay(() => results);
}

function advanceTimers(): Promise<any> {
    return act(async () => {
        await jest.runAllTimers();
    });
}

function usePaginatorTestHook(props): ReturnType<typeof useAsyncListing> {
    const paginator = usePaginator(PageNumberPaginator);
    return useAsyncListing({
        ...props,
        paginator,
    });
}

let globalWarnSpy;
beforeAll(() => {
    const original = console.warn;
    // For some reason when running these tests `response` is evaluated even though I've verified
    // nothing touches it. Could not work out why so suppressing it here. Have tested in browser
    // it does not occur.
    globalWarnSpy = jest.spyOn(console, 'warn').mockImplementation(w => {
        // Suppress warning on this message but keep anything else
        if (w === "'response' has been renamed to 'result' - please update usage") {
            return;
        }
        original.call(console, w);
    });
});

afterAll(() => {
    globalWarnSpy.mockRestore();
});

test('useAsyncListing should work without a paginator object', async () => {
    jest.useFakeTimers();
    const execute = jest.fn(mockedPaginatedResponse);
    const { result, rerender } = renderHook(
        ({ query }) =>
            useAsyncListing({
                execute,
                query,
            }),
        { initialProps: { query: {} } }
    );
    expect(result.current.isLoading).toBe(true);
    // starts at 2 due to StrictMode
    expect(execute).toHaveBeenCalledTimes(2);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(testData.slice(0, 5));
    rerender({ query: { search: 'Item 2' } });
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(3);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual([testData[2]]);
    expect(execute).toHaveBeenCalledTimes(3);
});

test('useAsyncListing should handle errors', async () => {
    jest.useFakeTimers();
    const execute = jest.fn((): Promise<TestDataItem[]> => delay(reject => reject('No good')));
    const { result } = renderHook(() =>
        useAsyncListing({
            execute,
        })
    );
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual('No good');
});

test('useAsyncListing should support paginator', async () => {
    jest.useFakeTimers();
    const execute = jest.fn(mockedPaginatedResponse);
    const { result, rerender } = renderHook(
        props =>
            usePaginatorTestHook({
                execute,
                ...props,
            }),
        { initialProps: {} }
    );
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(testData.slice(0, 5));
    const { paginator } = result.current;
    expect(paginator).toBeInstanceOf(PageNumberPaginator);
    if (!paginator) throw new Error('Expected paginator');
    act(() => paginator.next());
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(3);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(testData.slice(5, 10));
    rerender({ query: { search: '1' } });
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(4);
    await advanceTimers();
    // Changing query should have reset paginator state
    expect(paginator.currentState).toEqual({ page: 1, pageSize: 5 });
    expect(result.current.result).toEqual([testData[1], ...testData.slice(10, 14)]);
    act(() => paginator.next());
    await advanceTimers();
    expect(result.current.result).toEqual(testData.slice(14, 19));
});

test('useAsyncListing should support accumulatePages', async () => {
    jest.useFakeTimers();
    const execute1 = jest.fn(mockedPaginatedResponse);
    const execute2 = jest.fn(mockedPaginatedResponse);
    const { result, rerender } = renderHook(
        props =>
            usePaginatorTestHook({
                accumulatePages: true,
                ...props,
            }),
        { initialProps: { query: {}, execute: execute1 } }
    );
    expect(result.current.isLoading).toBe(true);
    expect(execute1).toHaveBeenCalledTimes(2);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(testData.slice(0, 5));
    const { paginator } = result.current;
    expect(paginator).toBeInstanceOf(PageNumberPaginator);
    if (!paginator) throw new Error('Expected paginator');
    act(() => paginator.next());
    expect(result.current.isLoading).toBe(true);
    expect(execute1).toHaveBeenCalledTimes(3);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(testData.slice(0, 10));
    rerender({ query: { search: '1' }, execute: execute1 });
    expect(result.current.isLoading).toBe(true);
    expect(execute1).toHaveBeenCalledTimes(4);
    await advanceTimers();
    // Changing query should have reset paginator state
    expect(paginator.currentState).toEqual({ page: 1, pageSize: 5 });
    expect(result.current.result).toEqual([testData[1], ...testData.slice(10, 14)]);
    act(() => paginator.next());
    await advanceTimers();
    expect(result.current.result).toEqual([testData[1], ...testData.slice(10, 19)]);

    // Changing back to first page should clear accumulated data
    act(() => paginator.first());
    await advanceTimers();
    expect(result.current.result).toEqual([testData[1], ...testData.slice(10, 14)]);
    rerender({ query: {}, execute: execute1 });
    await advanceTimers();

    // Jumping to anything other than next page should reset accumulated values
    expect(result.current.result).toEqual(testData.slice(0, 5));
    act(() => paginator.next());
    await advanceTimers();
    expect(result.current.result).toEqual(testData.slice(0, 10));
    act(() => (paginator as PageNumberPaginator).setPage(4));
    await advanceTimers();
    expect(result.current.result).toEqual(testData.slice(15, 20));

    // Changing page size should clear accumulated data
    act(() => paginator.first());
    await advanceTimers();
    expect(result.current.result).toEqual(testData.slice(0, 5));
    act(() => paginator.next());
    await advanceTimers();
    expect(result.current.result).toEqual(testData.slice(0, 10));
    act(() => (paginator as PageNumberPaginator).setPageSize(3));
    await advanceTimers();
    // Note that the page number is retained - just not the accumulated results
    expect(result.current.result).toEqual(testData.slice(3, 6));
    act(() => paginator.next());
    await advanceTimers();
    expect(result.current.result).toEqual(testData.slice(3, 9));

    // Changing execute should reset pagination back to page 1 and clear accumulated data
    rerender({ query: {}, execute: execute2 });
    expect(result.current.isLoading).toBe(true);
    expect(execute2).toHaveBeenCalledTimes(1);
    await advanceTimers();
    expect(paginator.currentState).toEqual({ page: 1, pageSize: 3 });
    expect(result.current.result).toEqual(testData.slice(0, 3));
    act(() => paginator.next());
    await advanceTimers();
    expect(result.current.result).toEqual(testData.slice(0, 6));
    expect(paginator.currentState).toEqual({ page: 2, pageSize: 3 });
    // Calling reset should clear accumulated items
    act(() => {
        result.current.reset();
    });
    expect(result.current.result).toEqual(null);
    await advanceTimers();
    act(() => {
        result.current.paginator?.first();
    });
    await advanceTimers();
    expect(paginator.currentState).toEqual({ page: 1, pageSize: 3 });
    expect(result.current.result).toEqual(testData.slice(0, 3));
});

test('useAsyncListing should support trigger option', async () => {
    jest.useFakeTimers();
    const execute = jest.fn(mockedPaginatedResponse);
    const { result, rerender } = renderHook(
        ({ trigger, query = {} }: { trigger: 'DEEP' | 'MANUAL'; query?: {} }) =>
            usePaginatorTestHook({
                execute,
                trigger,
                query,
            }),
        { initialProps: { trigger: 'MANUAL', query: {} } }
    );
    expect(result.current.isLoading).toBe(false);
    expect(execute).toHaveBeenCalledTimes(0);
    expect(result.current.result).toEqual(null);
    rerender({ trigger: 'DEEP' });
    expect(result.current.isLoading).toBe(true);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(testData.slice(0, 5));
    rerender({ trigger: 'MANUAL' });
    expect(result.current.isLoading).toBe(false);
    // Value is retained as all else remains constant
    expect(result.current.result).toEqual(testData.slice(0, 5));
    // If paginator changes and trigger is manual value should be cleared
    act(() => (result.current.paginator as PageNumberPaginator).next());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toEqual(null);

    // Run call so we have a result again
    act(() => {
        result.current.run();
    });
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toEqual(testData.slice(5, 10));

    // If query changes value should also be cleared while trigger is MANUAL
    rerender({ trigger: 'MANUAL', query: { search: 'Item 2' } });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toEqual(null);

    // Changing back to DEEP while maintaining same query must trigger fetch
    rerender({ trigger: 'DEEP', query: { search: 'Item 2' } });
    expect(result.current.isLoading).toBe(true);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual([testData[2]]);
});

test('useAsyncListing should not cause issues if unmounted', async () => {
    jest.useFakeTimers();
    const execute = jest.fn(mockedPaginatedResponse);
    const { result, unmount } = renderHook(
        ({ query }) =>
            useAsyncListing({
                execute,
                query,
            }),
        { initialProps: { query: {} } }
    );
    const errorSpy = jest.spyOn(global.console, 'error');
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
    unmount();
    await advanceTimers();
    expect(errorSpy).not.toHaveBeenCalled();
});

test('useAsyncListing should support reset', async () => {
    jest.useFakeTimers();
    const execute = jest.fn(mockedPaginatedResponse);
    const { result, rerender } = renderHook(
        ({ query }) =>
            useAsyncListing({
                execute,
                query,
            }),
        { initialProps: { query: {} } }
    );
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(testData.slice(0, 5));
    act(() => {
        result.current.reset();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(null);
    rerender({ query: { search: 'Item 2' } });
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(3);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual([testData[2]]);
    expect(execute).toHaveBeenCalledTimes(3);
});

test('useAsyncListing should support run', async () => {
    jest.useFakeTimers();
    const execute = jest.fn(mockedPaginatedResponse);
    const { result, rerender } = renderHook(
        ({ query }) =>
            useAsyncListing({
                execute,
                query,
                trigger: 'MANUAL',
            }),
        { initialProps: { query: {} } }
    );
    expect(result.current.isLoading).toBe(false);
    act(() => {
        result.current.run();
    });
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(testData.slice(0, 5));
    rerender({ query: { search: 'Item 2' } });
    expect(result.current.isLoading).toBe(false);
    act(() => {
        result.current.run();
    });
    expect(result.current.isLoading).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual([testData[2]]);
    expect(execute).toHaveBeenCalledTimes(2);
});

test('useAsyncListing should make sure `paginator` provided when `accumulatePages` is true', async () => {
    jest.useFakeTimers();
    const execute = jest.fn(mockedPaginatedResponse);
    global.console.error = jest.fn();
    expect(() =>
        renderHook(
            props =>
                useAsyncListing({
                    accumulatePages: true,
                    execute,
                    ...props,
                }),
            { initialProps: {} }
        )
    ).toThrowError('When `accumulatePages` is set `paginator` must be provided');
});

test('useAsyncListing should support changing execute function', async () => {
    jest.useFakeTimers();
    const execute1 = jest.fn(mockedPaginatedResponse);
    const execute2 = jest.fn(mockedPaginatedResponse);
    const { result, rerender } = renderHook(
        ({ query, execute }) =>
            useAsyncListing({
                execute,
                query,
            }),
        { initialProps: { query: {}, execute: execute1 } }
    );
    expect(result.current.isLoading).toBe(true);
    expect(execute1).toHaveBeenCalledTimes(2);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual(testData.slice(0, 5));
    rerender({ query: { search: 'Item 2' }, execute: execute1 });
    expect(result.current.isLoading).toBe(true);
    expect(execute1).toHaveBeenCalledTimes(3);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual([testData[2]]);
    expect(execute1).toHaveBeenCalledTimes(3);
    rerender({ query: { search: 'Item 2' }, execute: execute2 });
    expect(result.current.isLoading).toBe(true);
    expect(execute1).toHaveBeenCalledTimes(3);
    expect(execute2).toHaveBeenCalledTimes(1);
    await advanceTimers();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toEqual([testData[2]]);
    expect(execute1).toHaveBeenCalledTimes(3);
    expect(execute2).toHaveBeenCalledTimes(1);
});
