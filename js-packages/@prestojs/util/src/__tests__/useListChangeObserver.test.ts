import { renderHook } from '@testing-library/react-hooks';
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
