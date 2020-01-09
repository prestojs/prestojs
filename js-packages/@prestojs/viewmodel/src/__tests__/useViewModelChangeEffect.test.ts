import { act, renderHook } from '@testing-library/react-hooks';
import { recordEqualTo } from '../../../../../js-testing/matchers';
import Field from '../fields/Field';
import useViewModelCache from '../useViewModelCache';
import useViewModelChangeEffect from '../useViewModelChangeEffect';
import ViewModel from '../ViewModel';
import ViewModelCache from '../ViewModelCache';

class Test1 extends ViewModel {
    static _fields = {
        id: new Field(),
        name: new Field(),
    };
}
beforeEach(() => {
    Test1.cache = new ViewModelCache<Test1>(Test1);
});

test('useModelChangeEffect should detect additions', async () => {
    const data1 = { id: 1, name: 'a' };
    const data2 = { id: 2, name: 'b' };
    const data3 = { id: 3, name: 'c' };
    const data4 = { id: 4, name: 'd' };
    Test1.cache.add(data1);
    const selector = jest.fn(cache => cache.getAll(['name']));
    const cb = jest.fn();
    function useTestEffect(options = {}): void {
        const records = useViewModelCache(Test1, selector);
        useViewModelChangeEffect(records, cb, options);
    }
    const { rerender } = renderHook(({ options }) => useTestEffect(options), {
        initialProps: { options: {} },
    });
    expect(cb).not.toHaveBeenCalled();
    act(() => {
        Test1.cache.add(data2);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('ADD');
    cb.mockReset();

    // Should be able to opt out
    rerender({ options: { runOnAdd: false } });
    act(() => {
        Test1.cache.add(data3);
    });
    expect(cb).not.toHaveBeenCalled();

    // Should be able to opt in to diffs
    rerender({ options: { runOnAdd: true, includeDiff: true } });

    act(() => {
        Test1.cache.add(data4);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('ADD', {
        added: [recordEqualTo(data4)],
        previous: [recordEqualTo(data1), recordEqualTo(data2), recordEqualTo(data3)],
    });
});

test('useModelChangeEffect should detect updates', async () => {
    const data1 = { id: 1, name: 'a' };
    const data2 = { id: 1, name: 'aa' };
    const data3 = { id: 1, name: 'aaa' };
    const data4 = { id: 1, name: 'aaaa' };
    Test1.cache.add(data1);
    const selector = jest.fn(cache => cache.getAll(['name']));
    const cb = jest.fn();
    function useTestEffect(options = {}): void {
        const records = useViewModelCache(Test1, selector);
        useViewModelChangeEffect(records, cb, options);
    }
    const { rerender } = renderHook(({ options }) => useTestEffect(options), {
        initialProps: { options: {} },
    });
    expect(cb).not.toHaveBeenCalled();
    act(() => {
        Test1.cache.add(data2);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('UPDATE');
    cb.mockReset();

    // Should be able to opt out
    rerender({ options: { runOnUpdate: false } });
    act(() => {
        Test1.cache.add(data3);
    });
    expect(cb).not.toHaveBeenCalled();

    // Should be able to opt in to diffs
    rerender({ options: { runOnUpdate: true, includeDiff: true } });

    act(() => {
        Test1.cache.add(data4);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('UPDATE', {
        updated: [recordEqualTo(data4)],
        previous: [recordEqualTo(data3)],
    });
});

test('useModelChangeEffect should detect deletes', async () => {
    const data1 = { id: 1, name: 'a' };
    const data2 = { id: 2, name: 'b' };
    const data3 = { id: 3, name: 'c' };
    const data4 = { id: 4, name: 'd' };
    Test1.cache.add(data1);
    Test1.cache.add(data2);
    Test1.cache.add(data3);
    Test1.cache.add(data4);
    const selector = jest.fn(cache => cache.getAll(['name']));
    const cb = jest.fn();
    function useTestEffect(options = {}): void {
        const records = useViewModelCache(Test1, selector);
        useViewModelChangeEffect(records, cb, options);
    }
    const { rerender } = renderHook(({ options }) => useTestEffect(options), {
        initialProps: { options: {} },
    });
    expect(cb).not.toHaveBeenCalled();
    act(() => {
        Test1.cache.delete(1);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('DELETE');
    cb.mockReset();

    // Should be able to opt out
    rerender({ options: { runOnDelete: false } });
    act(() => {
        Test1.cache.delete(2);
    });
    expect(cb).not.toHaveBeenCalled();

    // Should be able to opt in to diffs
    rerender({ options: { runOnDelete: true, includeDiff: true } });

    act(() => {
        Test1.cache.delete(3);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('DELETE', {
        deleted: [recordEqualTo(data3)],
        previous: [recordEqualTo(data3), recordEqualTo(data4)],
    });
});
