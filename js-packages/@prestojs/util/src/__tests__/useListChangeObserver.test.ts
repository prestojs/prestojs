import { renderHook } from 'presto-testing-library';
import useListChangeObserver from '../useListChangeObserver';

test('useListChangeObserver should detect multiple changes', async () => {
    // This isn't done with a ViewModel as right now it's not possible to batch changes
    // to ViewModelCache.
    const cb = jest.fn();
    let records: { _key: number; name?: string }[] = [];
    function useTestEffect(options = {}): void {
        useListChangeObserver(records, cb, options);
    }
    const { rerender } = renderHook(() => useTestEffect(), {
        initialProps: { options: {} },
    });
    records = [{ _key: 1 }];
    rerender();
    expect(cb).toHaveBeenCalledWith(
        { ADD: [{ _key: 1 }], UPDATE: false, DELETE: false },
        [],
        [{ _key: 1 }]
    );
    records = [{ _key: 2 }, { _key: 3 }];
    rerender();
    expect(cb).toHaveBeenLastCalledWith(
        { ADD: [{ _key: 2 }, { _key: 3 }], UPDATE: false, DELETE: [{ _key: 1 }] },
        [{ _key: 1 }],
        [{ _key: 2 }, { _key: 3 }]
    );
    records = [{ _key: 1 }, { _key: 2, name: 'test' }];
    rerender();
    expect(cb).toHaveBeenLastCalledWith(
        {
            ADD: [{ _key: 1 }],
            UPDATE: [[{ _key: 2 }, { _key: 2, name: 'test' }]],
            DELETE: [{ _key: 3 }],
        },
        [{ _key: 2 }, { _key: 3 }],
        [{ _key: 1 }, { _key: 2, name: 'test' }]
    );
});

test('useListChangeObserver should support custom getId', async () => {
    const cb = jest.fn();
    let records: { uuid: number; name?: string }[] = [];
    const getId = (item): number => item.uuid;
    function useTestEffect(options = {}): void {
        return useListChangeObserver(records, cb, { ...options, getId });
    }
    const { rerender } = renderHook(() => useTestEffect());
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
