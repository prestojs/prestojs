import { Field, useViewModelCache, viewModelFactory } from '@prestojs/viewmodel';
import { act, renderHook } from '@testing-library/react-hooks';
import useListChangeObserver from '../useListChangeObserver';

test('useListChangeObserver should detect multiple changes', async () => {
    // This isn't done with a ViewModel as right now it's not possible to batch changes
    // to ViewModelCache.
    const cb = jest.fn();
    let records: { id: number; name?: string }[] = [];
    function useTestEffect(options = {}): void {
        useListChangeObserver(records, cb, options);
    }
    const { rerender } = renderHook(({ options }) => useTestEffect(options), {
        initialProps: { options: {} },
    });
    records = [{ id: 1 }];
    rerender();
    expect(cb).toHaveBeenCalledWith(
        { ADD: [{ id: 1 }], UPDATE: false, DELETE: false },
        [],
        [{ id: 1 }]
    );
    records = [{ id: 2 }, { id: 3 }];
    rerender();
    expect(cb).toHaveBeenLastCalledWith(
        { ADD: [{ id: 2 }, { id: 3 }], UPDATE: false, DELETE: [{ id: 1 }] },
        [{ id: 1 }],
        [{ id: 2 }, { id: 3 }]
    );
    records = [{ id: 1 }, { id: 2, name: 'test' }];
    rerender();
    expect(cb).toHaveBeenLastCalledWith(
        {
            ADD: [{ id: 1 }],
            UPDATE: [[{ id: 2 }, { id: 2, name: 'test' }]],
            DELETE: [{ id: 3 }],
        },
        [{ id: 2 }, { id: 3 }],
        [{ id: 1 }, { id: 2, name: 'test' }]
    );
});

test('useListChangeObserver should support custom getId', async () => {
    const cb = jest.fn();
    let records: { uuid: number; name?: string }[] = [];
    const getId = (item): number => item.uuid;
    function useTestEffect(options = {}): void {
        useListChangeObserver(records, cb, { ...options, getId });
    }
    const { rerender } = renderHook(({ options }) => useTestEffect(options), {
        initialProps: { options: {} },
    });
    records = [{ uuid: 1 }];
    rerender();
    expect(cb).toHaveBeenCalledWith(
        { ADD: [{ uuid: 1 }], UPDATE: false, DELETE: false },
        [],
        [{ uuid: 1 }]
    );
    records = [{ uuid: 2 }, { uuid: 3 }];
    rerender();
    expect(cb).toHaveBeenLastCalledWith(
        { ADD: [{ uuid: 2 }, { uuid: 3 }], UPDATE: false, DELETE: [{ uuid: 1 }] },
        [{ uuid: 1 }],
        [{ uuid: 2 }, { uuid: 3 }]
    );
    records = [{ uuid: 1 }, { uuid: 2, name: 'test' }];
    rerender();
    expect(cb).toHaveBeenLastCalledWith(
        {
            ADD: [{ uuid: 1 }],
            UPDATE: [[{ uuid: 2 }, { uuid: 2, name: 'test' }]],
            DELETE: [{ uuid: 3 }],
        },
        [{ uuid: 2 }, { uuid: 3 }],
        [{ uuid: 1 }, { uuid: 2, name: 'test' }]
    );
});

test('useListChangeObserver should detect additions', async () => {
    const Test1 = viewModelFactory({
        name: new Field(),
    });
    const data1 = new Test1({ id: 1, name: 'a' });
    const data2 = new Test1({ id: 2, name: 'b' });
    const data3 = new Test1({ id: 3, name: 'c' });
    const data4 = new Test1({ id: 4, name: 'd' });
    Test1.cache.add(data1);
    const selector = jest.fn(cache => {
        const records = cache.getAll(['name']);
        return records;
    });
    const cb = jest.fn();
    function useTestEffect(options = {}): void {
        const records = useViewModelCache(Test1, selector);
        useListChangeObserver(records, cb, options);
    }
    const { rerender } = renderHook(({ options }) => useTestEffect(options), {
        initialProps: { options: {} },
    });
    expect(cb).not.toHaveBeenCalled();
    act(() => {
        Test1.cache.add(data2);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
        { ADD: [data2], UPDATE: false, DELETE: false },
        [data1],
        [data1, data2]
    );
    cb.mockReset();
    act(() => {
        Test1.cache.add(data3);
    });
    expect(cb).toHaveBeenCalledWith(
        { ADD: [data3], UPDATE: false, DELETE: false },
        [data1, data2],
        [data1, data2, data3]
    );
    cb.mockReset();
    // Should be able to opt out
    rerender({ options: { runOnAdd: false } });
    act(() => {
        Test1.cache.add(data4);
    });
    expect(cb).not.toHaveBeenCalled();
});

test('useListChangeObserver should detect updates', async () => {
    const Test1 = viewModelFactory({
        name: new Field(),
    });
    const data1 = new Test1({ id: 1, name: 'a' });
    const data2 = new Test1({ id: 1, name: 'aa' });
    const data3 = new Test1({ id: 1, name: 'aaa' });
    const data4 = new Test1({ id: 1, name: 'aaaa' });
    Test1.cache.add(data1);
    const selector = jest.fn(cache => cache.getAll(['name']));
    const cb = jest.fn();
    function useTestEffect(options = {}): void {
        const records = useViewModelCache(Test1, selector);
        useListChangeObserver(records, cb, options);
    }
    const { rerender } = renderHook(({ options }) => useTestEffect(options), {
        initialProps: { options: {} },
    });
    expect(cb).not.toHaveBeenCalled();
    act(() => {
        Test1.cache.add(data2);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
        { ADD: false, UPDATE: [[data1, data2]], DELETE: false },
        [data1],
        [data2]
    );
    cb.mockReset();
    act(() => {
        Test1.cache.add(data3);
    });
    expect(cb).toHaveBeenCalledWith(
        { ADD: false, UPDATE: [[data2, data3]], DELETE: false },
        [data2],
        [data3]
    );

    cb.mockReset();
    // Should be able to opt out
    rerender({ options: { runOnUpdate: false } });
    act(() => {
        Test1.cache.add(data4);
    });
    expect(cb).not.toHaveBeenCalled();
});

test('useListChangeObserver should detect deletes', async () => {
    const Test1 = viewModelFactory({
        name: new Field(),
    });
    const data1 = new Test1({ id: 1, name: 'a' });
    const data2 = new Test1({ id: 2, name: 'b' });
    const data3 = new Test1({ id: 3, name: 'c' });
    const data4 = new Test1({ id: 4, name: 'd' });
    Test1.cache.add(data1);
    Test1.cache.add(data2);
    Test1.cache.add(data3);
    Test1.cache.add(data4);
    const selector = jest.fn(cache => cache.getAll(['name']));
    const cb = jest.fn();
    function useTestEffect(options = {}): void {
        const records = useViewModelCache(Test1, selector);
        useListChangeObserver(records, cb, options);
    }
    const { rerender } = renderHook(({ options }) => useTestEffect(options), {
        initialProps: { options: {} },
    });
    expect(cb).not.toHaveBeenCalled();
    act(() => {
        Test1.cache.delete(1);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
        { ADD: false, UPDATE: false, DELETE: [data1] },
        [data1, data2, data3, data4],
        [data2, data3, data4]
    );
    cb.mockReset();

    act(() => {
        Test1.cache.delete(3);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
        { ADD: false, UPDATE: false, DELETE: [data3] },
        [data2, data3, data4],
        [data2, data4]
    );

    cb.mockReset();
    // Should be able to opt out
    rerender({ options: { runOnDelete: false } });
    act(() => {
        Test1.cache.delete(2);
    });
    expect(cb).not.toHaveBeenCalled();
});
