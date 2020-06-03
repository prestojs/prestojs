import { act, renderHook } from '@testing-library/react-hooks';
import useAsyncValue from '../useAsyncValue';

function delay<T>(fn): Promise<T> {
    return new Promise((resolve, reject) => setTimeout(() => resolve(fn(reject))));
}

type TestDataItem = { name: string; _pk: number };
const testData: TestDataItem[] = Array.from({ length: 20 }, (_, i) => ({
    name: `Item ${i}`,
    _pk: i,
}));

function resolveSingle(id: number): Promise<TestDataItem> {
    if (Array.isArray(id)) {
        return delay(() => id.map(i => testData[i]));
    }
    return delay(reject => {
        if (!testData[id]) {
            return reject('Not found');
        }
        return testData[id];
    });
}

function resolveMulti(ids: number[]): Promise<TestDataItem[]> {
    return delay(() => ids.map(i => testData[i]));
}

type TestDataItemNoId = { name: string; uuid: number };
const testDataNoId: TestDataItemNoId[] = Array.from({ length: 20 }, (_, i) => ({
    name: `Item ${i}`,
    uuid: i,
}));
function resolveNoId(idOrIds: number): Promise<TestDataItemNoId | TestDataItemNoId[]> {
    if (Array.isArray(idOrIds)) {
        return delay(() => idOrIds.map(i => testDataNoId[i]));
    }
    return delay(() => testDataNoId[idOrIds]);
}

test('useAsyncValue should resolve individual values', async () => {
    jest.useFakeTimers();
    const resolve = jest.fn(resolveSingle);
    const { result, rerender } = renderHook(
        ({ id }: { id: number | null }) =>
            useAsyncValue({
                id,
                resolve,
            }),
        { initialProps: { id: 1 } }
    );
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 1', _pk: 1 });
    rerender({ id: 5 });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 5', _pk: 5 });

    rerender({ id: null });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual(null);
    expect(result.current.error).toEqual(null);

    rerender({ id: 500 });
    expect(resolve).toHaveBeenCalledTimes(3);
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toBe(null);
    expect(result.current.error).toBe('Not found');
});

test('useAsyncValue should resolve multiple values', async () => {
    jest.useFakeTimers();
    const resolve = jest.fn(resolveMulti);
    const { result, rerender } = renderHook(
        ({ ids }: { ids: number[] | null }) =>
            useAsyncValue({
                ids,
                resolve,
            }),
        { initialProps: { ids: [1, 2] } }
    );
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual([
        { name: 'Item 1', _pk: 1 },
        { name: 'Item 2', _pk: 2 },
    ]);
    rerender({ ids: [5] });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual([{ name: 'Item 5', _pk: 5 }]);

    rerender({ ids: null });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual(null);
    expect(result.current.error).toEqual(null);
});

test('useAsyncValue should use existing values if available', async () => {
    jest.useFakeTimers();
    const resolve = jest.fn(resolveSingle);
    const { result, rerender } = renderHook(
        ({ id, existingValues }) =>
            useAsyncValue({
                id,
                resolve,
                existingValues,
            }),
        { initialProps: { id: 1, existingValues: testData.slice(0, 5) } }
    );
    expect(resolve).toHaveBeenCalledTimes(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 1', _pk: 1 });
    rerender({ id: 10, existingValues: testData.slice(0, 5) });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 10', _pk: 10 });
    rerender({ id: 10, existingValues: [{ name: 'ITEM 10', _pk: 10 }] });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(result.current.value).toEqual({ name: 'ITEM 10', _pk: 10 });
});

test('useAsyncValue should error if getId required and not specified', async () => {
    jest.useFakeTimers();
    const resolve = jest.fn(resolveNoId);
    const { result } = renderHook(
        ({ id }) =>
            useAsyncValue({
                id,
                resolve,
                existingValues: testDataNoId.slice(0, 5),
            }),
        { initialProps: { id: 1 } }
    );
    expect(result.error).toEqual(
        new Error(
            'Provided item does not implement Identifiable and no fallback getter was specified. To fix pass `getId` to `useAsyncValue`.'
        )
    );
});

test('useAsyncValue should use existing values if available and require getId for non-Identifiables', async () => {
    jest.useFakeTimers();
    const resolve = jest.fn(resolveNoId);
    const { result, rerender } = renderHook(
        ({ id }) =>
            useAsyncValue({
                id,
                resolve,
                getId: (item: TestDataItemNoId): number => item.uuid,
                existingValues: testDataNoId.slice(0, 5),
            }),
        { initialProps: { id: 1 } }
    );
    expect(resolve).toHaveBeenCalledTimes(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 1', uuid: 1 });
    rerender({ id: 10 });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 10', uuid: 10 });
});

test('useAsyncValue should respect trigger', async () => {
    jest.useFakeTimers();
    const resolve = jest.fn(resolveSingle);
    const { result, rerender } = renderHook(
        ({
            id,
            trigger,
            ...rest
        }: {
            id: number | null;
            trigger: 'MANUAL' | 'DEEP';
            existingValues?: typeof testData;
        }) =>
            useAsyncValue({
                id,
                resolve,
                trigger,
                ...rest,
            }),
        { initialProps: { id: 1, trigger: 'MANUAL' } }
    );
    expect(resolve).toHaveBeenCalledTimes(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toBe(null);
    rerender({ id: 1, trigger: 'DEEP' });
    expect(result.current.isLoading).toBe(true);
    expect(resolve).toHaveBeenCalledTimes(1);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 1', _pk: 1 });
    rerender({ id: 5, trigger: 'MANUAL' });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual(null);
    rerender({ id: 6, trigger: 'DEEP' });
    expect(result.current.isLoading).toBe(true);
    expect(resolve).toHaveBeenCalledTimes(2);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 6', _pk: 6 });

    // Passing existing values and switching trigger shouldn't trigger any calls to resolve
    rerender({ id: 10, trigger: 'MANUAL', existingValues: testData });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 10', _pk: 10 });
    rerender({ id: 10, trigger: 'DEEP', existingValues: testData });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 10', _pk: 10 });

    // Rerendering with different id while on MANUAL should clear value
    rerender({ id: 11, trigger: 'MANUAL', existingValues: [] });
    expect(result.current.value).toBe(null);
});

test('useAsyncValue should support run', async () => {
    jest.useFakeTimers();
    const resolve = jest.fn(resolveSingle);
    const { result, rerender } = renderHook(
        ({ id }: { id: number | null }) =>
            useAsyncValue({
                id,
                resolve,
                trigger: 'MANUAL',
            }),
        { initialProps: { id: 1 } }
    );
    expect(resolve).toHaveBeenCalledTimes(0);
    expect(result.current.isLoading).toBe(false);
    act(() => {
        result.current.run();
    });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 1', _pk: 1 });
    rerender({ id: 5 });
    expect(resolve).toHaveBeenCalledTimes(1);
    act(() => {
        result.current.run();
    });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 5', _pk: 5 });
});

test('useAsyncValue should support reset', async () => {
    jest.useFakeTimers();
    const resolve = jest.fn(resolveSingle);
    const { result, rerender } = renderHook(
        ({ id }: { id: number | null }) =>
            useAsyncValue({
                id,
                resolve,
            }),
        { initialProps: { id: 1 } }
    );
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.value).toEqual({ name: 'Item 1', _pk: 1 });
    expect(resolve).toHaveBeenCalledTimes(1);
    act(() => result.current.reset());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toBe(null);
    act(() => {
        result.current.run();
    });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(result.current.value).toEqual({ name: 'Item 1', _pk: 1 });
    rerender({ id: 5 });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 5', _pk: 5 });
});

test('useAsyncValue should handle changes to resolve', async () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(
        ({
            id,
            resolve = resolveSingle,
            getId,
        }: {
            id: number | null;
            resolve?: (id: number) => Promise<any>;
            getId?: (item: any) => number;
        }) =>
            useAsyncValue({
                id,
                resolve,
                getId,
            }),
        { initialProps: { id: 1, resolve: resolveSingle } }
    );
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 1', _pk: 1 });
    rerender({ id: 5 });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 5', _pk: 5 });

    rerender({ id: 5, resolve: resolveNoId, getId: (item: TestDataItemNoId): number => item.uuid });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 5', uuid: 5 });

    rerender({ id: 1, resolve: resolveNoId, getId: (item: TestDataItemNoId): number => item.uuid });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toEqual({ name: 'Item 1', uuid: 1 });
});
