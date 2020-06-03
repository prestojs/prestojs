import { act, renderHook } from '@testing-library/react-hooks';
import { useState } from 'react';
import PageNumberPaginator from '../pagination/PageNumberPaginator';
import { PaginatorInterfaceClass } from '../pagination/Paginator';
import usePaginator, { PaginatorClassProvider } from '../pagination/usePaginator';

test('should accept paginator class', async () => {
    const { result } = renderHook(() => usePaginator(PageNumberPaginator));

    expect(result.current).toBeInstanceOf(PageNumberPaginator);
    act(() => result.current.setResponse({ total: 10, pageSize: 5 }));

    expect(result.current.pageSize).toBe(5);

    act(() => result.current.next());
    expect(result.current.currentState).toEqual({
        pageSize: 5,
        page: 2,
    });
});

test('should accept state', async () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function useTestHook() {
        const [state, setState] = useState<{ page: number; pageSize: number }>();
        const paginator = usePaginator(PageNumberPaginator, [state, setState]);
        return {
            state,
            setState,
            paginator,
        };
    }
    const { result } = renderHook(() => useTestHook());

    act(() => result.current.paginator.setResponse({ total: 10, pageSize: 5 }));
    expect(result.current.paginator.pageSize).toBe(5);

    act(() => result.current.paginator.next());
    expect(result.current.state).toEqual({
        pageSize: 5,
        page: 2,
    });

    act(() => result.current.setState({ page: 1, pageSize: 10 }));
    expect(result.current.paginator.pageSize).toBe(10);
    expect(result.current.paginator.page).toBe(1);
});

test('should accept state with initial state', async () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function useTestHook(initialState: {}) {
        const [state, setState] = useState(initialState);
        const paginator = usePaginator(PageNumberPaginator, [state, setState]);
        return {
            state,
            setState,
            paginator,
        };
    }
    const { result } = renderHook(() => useTestHook({ page: 2, pageSize: 20 }));

    expect(result.current.paginator.pageSize).toBe(20);
    expect(result.current.paginator.page).toBe(2);

    act(() => result.current.setState({ page: 1, pageSize: 10 }));
    expect(result.current.paginator.pageSize).toBe(10);
    expect(result.current.paginator.page).toBe(1);
});

test('should accept no value', async () => {
    let action1: null | PaginatorClassProvider<any> = null;
    const { result, rerender } = renderHook(() => usePaginator(action1));

    expect(result.current).toBe(null);

    action1 = {
        getPaginatorClass(): PaginatorInterfaceClass<any> {
            return PageNumberPaginator;
        },
    };
    rerender();

    act(() => result.current.setResponse({ total: 10, pageSize: 5 }));

    expect((result.current as PageNumberPaginator).pageSize).toBe(5);

    act(() => (result.current as PageNumberPaginator).next());
    expect((result.current as PageNumberPaginator).currentState).toEqual({
        pageSize: 5,
        page: 2,
    });
});

test('should not set state after unmount', async () => {
    const { result, unmount } = renderHook(() => usePaginator(PageNumberPaginator));
    const paginator = result.current;
    act(() => paginator.setResponse({ total: 10, pageSize: 5 }));

    unmount();

    // eslint-disable-next-line
    const mockError = jest.spyOn(global.console, 'error').mockImplementation(() => {});
    // This should be a noop after unmount. If it's not React will log an error about
    // "Can't perform a React state update on an unmounted component"
    act(() => paginator.setResponse({ total: 5, pageSize: 2 }));
    expect(mockError).not.toHaveBeenCalled();
    mockError.mockRestore();
});
