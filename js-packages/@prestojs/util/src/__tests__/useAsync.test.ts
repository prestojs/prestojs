import { act, renderHook } from '@testing-library/react-hooks';
import { useEffect } from 'react';
import useAsync from '../useAsync';

const matchesFunction = {
    asymmetricMatch(actual): boolean {
        return typeof actual === 'function';
    },
};

test('useAsync should call action if trigger changes from manual', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ trigger }: { trigger: 'MANUAL' | 'SHALLOW' }) => useAsync(callAction1, { trigger }),
        { initialProps: { trigger: useAsync.MANUAL } }
    );
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ trigger: useAsync.SHALLOW });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
});

test('useAsync should not call action if trigger changes to manual', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ trigger }: { trigger: 'MANUAL' | 'SHALLOW' }) => useAsync(callAction1, { trigger }),
        { initialProps: { trigger: useAsync.SHALLOW } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ trigger: useAsync.MANUAL });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
});

test('useAsync should not re-call action if trigger changes from deep to shallow if otherwise equal', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ trigger }: { trigger: 'DEEP' | 'SHALLOW' }) => useAsync(callAction1, { trigger }),
        { initialProps: { trigger: useAsync.DEEP } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ trigger: useAsync.SHALLOW });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
});

test('useAsync should re-call action if trigger changes from deep to shallow', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ trigger, args }: { trigger: 'DEEP' | 'SHALLOW'; args: any }) =>
            useAsync(callAction1, { trigger, args }),
        { initialProps: { trigger: useAsync.DEEP, args: [{ id: 1 }] } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ trigger: useAsync.SHALLOW, args: [{ id: 1 }] });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    // Changing back to deep should not re-execute
    rerender({ trigger: useAsync.DEEP, args: [{ id: 1 }] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
});

test('useAsync should not set state after unmount', async () => {
    const callAction1 = jest.fn(() => Promise.reject('test error'));
    const { result, unmount } = renderHook(({ trigger }) => useAsync(callAction1, { trigger }), {
        initialProps: { trigger: useAsync.SHALLOW },
    });
    const errorSpy = jest.spyOn(global.console, 'error');
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    unmount();
    expect(errorSpy).not.toHaveBeenCalled();
});

test('useAsync should not set state after unmount (multiple unresolved calls)', async () => {
    jest.useFakeTimers();
    const callAction1 = jest.fn(() => new Promise(resolve => setTimeout(resolve)));
    const callAction2 = jest.fn(() => new Promise((_, reject) => setTimeout(reject)));
    const { result, unmount, rerender } = renderHook(
        ({ action, trigger }) => useAsync(action, { trigger }),
        { initialProps: { action: callAction1, trigger: useAsync.SHALLOW } }
    );
    const errorSpy = jest.spyOn(global.console, 'error');
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction2, trigger: useAsync.SHALLOW });
    unmount();
    await jest.runAllTimers();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(callAction1).toHaveBeenCalled();
    expect(callAction2).toHaveBeenCalled();
});

test('useAsync should not set state after unmount (multiple unresolved calls trigger manually)', async () => {
    jest.useFakeTimers();
    const callAction1 = jest.fn(() => new Promise(resolve => setTimeout(resolve)));
    const callAction2 = jest.fn(() => new Promise((_, reject) => setTimeout(reject)));
    const { result, unmount, rerender } = renderHook(({ action }) => useAsync(action), {
        initialProps: { action: callAction1 },
    });
    const errorSpy = jest.spyOn(global.console, 'error');
    act(() => {
        result.current.run();
    });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction2 });
    // Executing again will call callAction2 - promise from first action not yet
    // resolved. We expect that when we unmount both promises should be 'aborted'
    act(() => {
        result.current.run();
    });
    unmount();
    await jest.runAllTimers();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(callAction1).toHaveBeenCalled();
    expect(callAction2).toHaveBeenCalled();
});

test('useAsync with MANUAL trigger should not set state after unmount (trigger before unmount)', async () => {
    const callAction1 = jest.fn(() => Promise.reject('test error'));
    const { result, unmount } = renderHook(() => useAsync(callAction1));
    const errorSpy = jest.spyOn(global.console, 'error');
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    act(() => {
        result.current.run();
    });
    unmount();
    expect(errorSpy).not.toHaveBeenCalled();
});

test('useAsync with MANUAL trigger should not set state after unmount (triggered after unmount)', async () => {
    const callAction1 = jest.fn(() => Promise.reject('test error'));
    const { result, unmount } = renderHook(() => useAsync(callAction1));
    const errorSpy = jest.spyOn(global.console, 'error');
    const warnSpy = jest.fn();
    global.console.warn = warnSpy;
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    unmount();
    act(() => {
        expect(result.current.run()).rejects.toContain(
            'method was called after component was unmounted'
        );
    });
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('method was called after component was unmounted')
    );
});

test('useAsync should support onSuccess/onError', async () => {
    jest.useFakeTimers();
    const callAction1 = jest.fn(
        () =>
            new Promise(resolve => {
                setTimeout(() => resolve('test1'));
            })
    );
    const props1 = { id: 1 };
    const onSuccess = jest.fn();
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ onSuccess }) =>
            useAsync(callAction1, { onSuccess, args: [props1], trigger: useAsync.DEEP }),
        {
            initialProps: { onSuccess: (): void => onSuccess(1) },
        }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    jest.runAllTimers();
    rerender({
        onSuccess: () => onSuccess(2),
    });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(onSuccess).toHaveBeenLastCalledWith(1);
});

test('useAsync should support changing args on MANUAL functions', async () => {
    const callAction1 = jest.fn((arg1, arg2) => Promise.resolve([arg1, arg2]));
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ args }) => useAsync(callAction1, { args }),
        {
            initialProps: { args: [1, 2] },
        }
    );
    act(() => {
        result.current.run();
    });
    expect(callAction1).toHaveBeenCalledWith(1, 2);
    waitForNextUpdate();
    rerender({ args: [4, 5] });
    act(() => {
        result.current.run();
    });
    expect(callAction1).toHaveBeenLastCalledWith(4, 5);
});

test('useAsync should support passing different arguments in run', async () => {
    const callAction1 = jest.fn((arg1, arg2) => Promise.resolve([arg1, arg2]));
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ args }) => useAsync(callAction1, { args }),
        {
            initialProps: { args: [1, 2] },
        }
    );
    act(() => {
        result.current.run();
    });
    expect(callAction1).toHaveBeenCalledWith(1, 2);
    waitForNextUpdate();
    rerender({ args: [4, 5] });
    act(() => {
        result.current.run(10, 11);
    });
    expect(callAction1).toHaveBeenLastCalledWith(10, 11);
});

test('useAsync should properly memoize run', async () => {
    const callAction1 = jest.fn(id => Promise.resolve(`id: ${id}`));
    // If not memoized properly this will result in infinite loop
    function useTestHook(id): any {
        const { run, isLoading, response } = useAsync(callAction1, { args: [id] });

        useEffect(() => {
            if (id) {
                run();
            }
        }, [id, run]);

        if (isLoading) {
            return 'loading';
        }

        return response;
    }
    jest.useFakeTimers();
    const { result, rerender } = renderHook(({ id }) => useTestHook(id), {
        initialProps: { id: 1 },
    });
    expect(callAction1).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual('loading');
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(callAction1).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual('id: 1');
    rerender({ id: 2 });
    expect(callAction1).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual('loading');
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(callAction1).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual('id: 2');
});

test('useAsync should re-trigger if arguments changes when trigger is SHALLOW', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ trigger, args }) => useAsync(callAction1, { trigger, args }),
        { initialProps: { trigger: useAsync.SHALLOW, args: [1, 2] } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(1);
    expect(callAction1).toHaveBeenCalledWith(1, 2);
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ trigger: useAsync.SHALLOW, args: [1, 2] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(1);
    rerender({ trigger: useAsync.SHALLOW, args: [1, 3] });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(2);
    expect(callAction1).toHaveBeenCalledWith(1, 3);
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ trigger: useAsync.SHALLOW, args: [1, 3] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(2);
});

test('useAsync should re-trigger if arguments changes when trigger is DEEP', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ trigger, args }) => useAsync(callAction1, { trigger, args }),
        { initialProps: { trigger: useAsync.DEEP, args: [{ ids: [1, 2] }] } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledWith({ ids: [1, 2] });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ trigger: useAsync.DEEP, args: [{ ids: [1, 2] }] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(1);
    rerender({ trigger: useAsync.DEEP, args: [{ ids: [1, 3] }] });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(2);
    expect(callAction1).toHaveBeenLastCalledWith({ ids: [1, 3] });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ trigger: useAsync.DEEP, args: [{ ids: [1, 3] }] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(2);
});

test('useAsync should re-trigger if function changes when trigger is SHALLOW', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const callAction2 = jest.fn(() => Promise.resolve('test2'));
    const options = { trigger: useAsync.SHALLOW };
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ action, ...options }) => useAsync(action, options),
        {
            initialProps: {
                action: callAction1,
                ...options,
            },
        }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(1);
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction1, ...options });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction2, ...options });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitForNextUpdate();
    expect(callAction1).toHaveBeenCalledTimes(1);
    expect(callAction2).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test2',
        run: matchesFunction,
        reset: matchesFunction,
    });
});

test('useAsync should re-trigger if function changes when trigger is DEEP', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const callAction2 = jest.fn(() => Promise.resolve('test2'));
    const options = { trigger: useAsync.DEEP };
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ action, ...options }) => useAsync(action, options),
        {
            initialProps: {
                action: callAction1,
                ...options,
            },
        }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(1);
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction1, ...options });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction2, ...options });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitForNextUpdate();
    expect(callAction1).toHaveBeenCalledTimes(1);
    expect(callAction2).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test2',
        run: matchesFunction,
        reset: matchesFunction,
    });
});

test('useAsync should handle errors', async () => {
    const error1 = new Error('No good');
    const error2 = new Error('No good again');
    const callAction1 = jest.fn(() => Promise.reject(error1));
    const callAction2 = jest.fn(() => Promise.reject(error2));
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ action, ...options }) => useAsync(action, options),
        {
            initialProps: {
                action: callAction1,
                trigger: useAsync.SHALLOW,
            },
        }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: error1,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction2, trigger: useAsync.SHALLOW });
    expect(result.current).toEqual({
        isLoading: true,
        error: error1,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: error2,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
});

test('useAsync return a reset function that clears response / error', async () => {
    jest.useFakeTimers();
    const callAction1 = jest.fn(() => new Promise(resolve => setTimeout(() => resolve('test1'))));
    const onSuccess = jest.fn();
    const options: { trigger: 'SHALLOW' | 'MANUAL'; args?: number[]; onSuccess?: () => void } = {
        trigger: useAsync.SHALLOW,
        args: [1, 2],
        onSuccess,
    };
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ action, ...options }) => useAsync(action, options),
        {
            initialProps: {
                action: callAction1,
                ...options,
            },
        }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledWith(1, 2);
    jest.runAllTimers();
    await waitForNextUpdate();
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    act(() => {
        result.current.reset();
    });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction1, ...options, args: [3, 4] });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    act(() => {
        result.current.reset();
    });
    jest.runAllTimers();
    // We reset before promise resolved - we don't expect the onSuccess to have
    // been called
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    // Resetting for a MANUAL trigger should also work
    rerender({ action: callAction1, trigger: useAsync.MANUAL });
    act(() => {
        result.current.run();
    });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    act(() => {
        result.current.reset();
    });
    jest.runAllTimers();
    expect(onSuccess).toHaveBeenCalledTimes(1);
});

test('useAsync should throw an error if invalid option specified', async () => {
    const asyncFn = jest.fn(() => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const { result } = renderHook(() => useAsync(asyncFn, { unknownKey: 1 }));
    expect(result.error).toEqual(
        Error(
            'Invalid options specified: unknownKey. Valid options are: trigger, args, onSuccess, onError'
        )
    );
});

test('useAsync should call reset loading state if call is aborted', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const callAction2 = jest.fn(() => Promise.resolve('test2'));
    const { result, rerender } = renderHook(
        ({ action, trigger }: { action: typeof callAction1; trigger: 'MANUAL' | 'DEEP' }) =>
            useAsync(action, { trigger }),
        { initialProps: { action: callAction1, trigger: useAsync.DEEP } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    // Switch to manual rendering before initial call finishes - isLoading state
    // should reset to false and not get stuck on isLoading
    act(() => {
        rerender({ action: callAction2, trigger: useAsync.MANUAL });
    });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
});
