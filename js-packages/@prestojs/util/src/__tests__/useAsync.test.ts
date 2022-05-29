import { act, renderHook, waitFor } from 'presto-testing-library';
import { useEffect } from 'react';
import useAsync from '../useAsync';

const matchesFunction = {
    asymmetricMatch(actual): boolean {
        return typeof actual === 'function';
    },
};

let globalWarnSpy;

beforeAll(() => {
    const original = console.warn;
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

test('useAsync should call action if trigger changes from manual', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, rerender } = renderHook(
        ({ trigger }: { trigger: 'MANUAL' | 'SHALLOW' }) => useAsync(callAction1, { trigger }),
        { initialProps: { trigger: useAsync.MANUAL } }
    );
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ trigger: useAsync.SHALLOW });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitFor(() => {
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        });
    });
});

test('useAsync should not call action if trigger changes to manual', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, rerender } = renderHook(
        ({ trigger }: { trigger: 'MANUAL' | 'SHALLOW' }) => useAsync(callAction1, { trigger }),
        { initialProps: { trigger: useAsync.SHALLOW } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ trigger: useAsync.MANUAL });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
});

test('useAsync should not re-call action if trigger changes from deep to shallow if otherwise equal', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, rerender } = renderHook(
        ({ trigger }: { trigger: 'DEEP' | 'SHALLOW' }) => useAsync(callAction1, { trigger }),
        { initialProps: { trigger: useAsync.DEEP } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ trigger: useAsync.SHALLOW });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
});

test('useAsync should re-call action if trigger changes from deep to shallow', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, rerender } = renderHook(
        ({ trigger, args }: { trigger: 'DEEP' | 'SHALLOW'; args: any }) =>
            useAsync(callAction1, { trigger, args }),
        { initialProps: { trigger: useAsync.DEEP, args: [{ id: 1 }] } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ trigger: useAsync.SHALLOW, args: [{ id: 1 }] });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    // Changing back to deep should not re-execute
    rerender({ trigger: useAsync.DEEP, args: [{ id: 1 }] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: 'test1',
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
        result: null,
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
        result: null,
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
        result: null,
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
    const { result, rerender } = renderHook(
        ({ onSuccess }) =>
            useAsync(callAction1, { onSuccess, args: [props1], trigger: useAsync.DEEP }),
        {
            initialProps: { onSuccess: (): void => onSuccess(1) },
        }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    jest.runAllTimers();
    rerender({
        onSuccess: () => onSuccess(2),
    });
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    expect(onSuccess).toHaveBeenLastCalledWith(1);
});

test('useAsync should support changing args on MANUAL functions', async () => {
    const callAction1 = jest.fn((arg1, arg2) => Promise.resolve([arg1, arg2]));
    const { result, rerender } = renderHook(({ args }) => useAsync(callAction1, { args }), {
        initialProps: { args: [1, 2] },
    });
    act(() => {
        result.current.run();
    });
    await waitFor(() => expect(result.current.result).toEqual([1, 2]));
    expect(callAction1).toHaveBeenCalledWith(1, 2);
    rerender({ args: [4, 5] });
    act(() => {
        result.current.run();
    });
    expect(callAction1).toHaveBeenLastCalledWith(4, 5);
    await waitFor(() => expect(result.current.result).toEqual([4, 5]));
});

test('useAsync should support passing different arguments in run', async () => {
    const callAction1 = jest.fn((arg1, arg2) => Promise.resolve([arg1, arg2]));
    const { result, rerender } = renderHook(({ args }) => useAsync(callAction1, { args }), {
        initialProps: { args: [1, 2] },
    });
    act(() => {
        result.current.run();
    });
    expect(callAction1).toHaveBeenCalledWith(1, 2);
    await waitFor(() => expect(result.current.result).toEqual([1, 2]));
    rerender({ args: [4, 5] });
    act(() => {
        result.current.run(10, 11);
    });
    expect(callAction1).toHaveBeenLastCalledWith(10, 11);
    await waitFor(() => expect(result.current.result).toEqual([10, 11]));
});

test('useAsync should properly memoize run', async () => {
    const callAction1 = jest.fn(id => Promise.resolve(`id: ${id}`));
    // If not memoized properly this will result in infinite loop
    function useTestHook(id): any {
        const { run, isLoading, result } = useAsync(callAction1, { args: [id] });

        useEffect(() => {
            if (id) {
                run();
            }
        }, [id, run]);

        if (isLoading) {
            return 'loading';
        }

        return result;
    }
    jest.useFakeTimers();
    const { result, rerender } = renderHook(({ id }) => useTestHook(id), {
        initialProps: { id: 1 },
    });
    // Start at 2 because StrictMode adds extra one at beginning
    let calledCount = 2;
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    expect(result.current).toEqual('loading');
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    expect(result.current).toEqual('id: 1');
    rerender({ id: 2 });
    expect(callAction1).toHaveBeenCalledTimes(++calledCount);
    expect(result.current).toEqual('loading');
    await act(async () => {
        await jest.runAllTimers();
    });
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    expect(result.current).toEqual('id: 2');
});

test('useAsync should re-trigger if arguments changes when trigger is SHALLOW', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, rerender } = renderHook(
        ({ trigger, args }) => useAsync(callAction1, { trigger, args }),
        { initialProps: { trigger: useAsync.SHALLOW, args: [1, 2] } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    // Start at 2 because StrictMode adds extra one at beginning
    let calledCount = 2;
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    expect(callAction1).toHaveBeenCalledWith(1, 2);
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ trigger: useAsync.SHALLOW, args: [1, 2] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    rerender({ trigger: useAsync.SHALLOW, args: [1, 3] });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(++calledCount);
    expect(callAction1).toHaveBeenCalledWith(1, 3);
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ trigger: useAsync.SHALLOW, args: [1, 3] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
});

test('useAsync should re-trigger if arguments changes when trigger is DEEP', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const { result, rerender } = renderHook(
        ({ trigger, args }) => useAsync(callAction1, { trigger, args }),
        { initialProps: { trigger: useAsync.DEEP, args: [{ ids: [1, 2] }] } }
    );
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledWith({ ids: [1, 2] });
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ trigger: useAsync.DEEP, args: [{ ids: [1, 2] }] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    // Start at 2 because StrictMode adds extra one at beginning
    let calledCount = 2;
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    rerender({ trigger: useAsync.DEEP, args: [{ ids: [1, 3] }] });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(++calledCount);
    expect(callAction1).toHaveBeenLastCalledWith({ ids: [1, 3] });
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ trigger: useAsync.DEEP, args: [{ ids: [1, 3] }] });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
});

test('useAsync should re-trigger if function changes when trigger is SHALLOW', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const callAction2 = jest.fn(() => Promise.resolve('test2'));
    const options = { trigger: useAsync.SHALLOW };
    const { result, rerender } = renderHook(({ action, ...options }) => useAsync(action, options), {
        initialProps: {
            action: callAction1,
            ...options,
        },
    });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    // Start at 2 because StrictMode adds extra one at beginning
    let calledCount = 2;
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ action: callAction1, ...options });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction2, ...options });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    expect(callAction2).toHaveBeenCalledTimes(1);
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test2',
            response: 'test2',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
});

test('useAsync should re-trigger if function changes when trigger is DEEP', async () => {
    const callAction1 = jest.fn(() => Promise.resolve('test1'));
    const callAction2 = jest.fn(() => Promise.resolve('test2'));
    const options = { trigger: useAsync.DEEP };
    const { result, rerender } = renderHook(({ action, ...options }) => useAsync(action, options), {
        initialProps: {
            action: callAction1,
            ...options,
        },
    });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    // Start at 2 because StrictMode adds extra one at beginning
    let calledCount = 2;
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ action: callAction1, ...options });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction2, ...options });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: 'test1',
        response: 'test1',
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledTimes(calledCount);
    expect(callAction2).toHaveBeenCalledTimes(1);
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test2',
            response: 'test2',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
});

test('useAsync should handle errors', async () => {
    const error1 = new Error('No good');
    const error2 = new Error('No good again');
    const callAction1 = jest.fn(() => Promise.reject(error1));
    const callAction2 = jest.fn(() => Promise.reject(error2));
    const { result, rerender } = renderHook(({ action, ...options }) => useAsync(action, options), {
        initialProps: {
            action: callAction1,
            trigger: useAsync.SHALLOW,
        },
    });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: error1,
            result: null,
            response: null,
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    rerender({ action: callAction2, trigger: useAsync.SHALLOW });
    expect(result.current).toEqual({
        isLoading: true,
        error: error1,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: error2,
            result: null,
            response: null,
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
});

test('useAsync return a reset function that clears result / error', async () => {
    jest.useFakeTimers();
    const callAction1 = jest.fn(() => new Promise(resolve => setTimeout(() => resolve('test1'))));
    const onSuccess = jest.fn();
    const options: { trigger: 'SHALLOW' | 'MANUAL'; args?: number[]; onSuccess?: () => void } = {
        trigger: useAsync.SHALLOW,
        args: [1, 2],
        onSuccess,
    };
    const { result, rerender } = renderHook(({ action, ...options }) => useAsync(action, options), {
        initialProps: {
            action: callAction1,
            ...options,
        },
    });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    expect(callAction1).toHaveBeenCalledWith(1, 2);
    jest.runAllTimers();
    await waitFor(() =>
        expect(result.current).toEqual({
            isLoading: false,
            error: null,
            result: 'test1',
            response: 'test1',
            run: matchesFunction,
            reset: matchesFunction,
        })
    );
    // 2 because first time StrictMode triggers extra call
    expect(callAction1).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    act(() => {
        result.current.reset();
    });
    expect(result.current).toEqual({
        isLoading: false,
        error: null,
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
    rerender({ action: callAction1, ...options, args: [3, 4] });
    expect(result.current).toEqual({
        isLoading: true,
        error: null,
        result: null,
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
        result: null,
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
        result: null,
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
    global.console.error = jest.fn();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => renderHook(() => useAsync(asyncFn, { unknownKey: 1 }))).toThrowError(
        'Invalid options specified: unknownKey. Valid options are: trigger, args, onSuccess, onError'
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
        result: null,
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
        result: null,
        response: null,
        run: matchesFunction,
        reset: matchesFunction,
    });
});
