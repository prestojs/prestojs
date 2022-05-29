import { useListChangeObserver } from '@prestojs/util';
import { act, renderHook } from 'presto-testing-library';
import { Field, useViewModelCache, viewModelFactory } from '../index';

test('useListChangeObserver should detect additions', async () => {
    const Test1 = viewModelFactory(
        {
            id: new Field(),
            name: new Field(),
        },
        { pkFieldName: 'id' }
    );
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
    const Test1 = viewModelFactory(
        {
            id: new Field(),
            name: new Field(),
        },
        { pkFieldName: 'id' }
    );
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
    const Test1 = viewModelFactory(
        {
            id: new Field(),
            name: new Field(),
        },
        { pkFieldName: 'id' }
    );
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
