import { UrlPattern } from '@prestojs/routing';
import { act, renderHook } from '@testing-library/react-hooks';
import { useState } from 'react';
import InferredPaginator from '../InferredPaginator';
import PageNumberPaginator from '../PageNumberPaginator';
import PaginatedEndpoint from '../PaginatedEndpoint';
import usePaginator from '../usePaginator';

test('should accept endpoint', async () => {
    const action1 = new PaginatedEndpoint(new UrlPattern('/whatever/'));
    const { result } = renderHook(() => usePaginator(action1));

    act(() => result.current.setResponse({ total: 10, pageSize: 5 }));

    expect(((result.current as InferredPaginator).paginator as PageNumberPaginator).pageSize).toBe(
        5
    );

    act(() => (result.current as InferredPaginator).next());
    expect((result.current as InferredPaginator).currentState).toEqual({
        pageSize: 5,
        page: 2,
    });
});

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
    let action1: null | PaginatedEndpoint = null;
    const { result, rerender } = renderHook(() => usePaginator(action1));

    expect(result.current).toBe(null);

    action1 = new PaginatedEndpoint(new UrlPattern('/whatever/'));
    rerender();

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    act(() => result.current.setResponse({ total: 10, pageSize: 5 }));

    expect(((result.current as InferredPaginator).paginator as PageNumberPaginator).pageSize).toBe(
        5
    );

    act(() => (result.current as InferredPaginator).next());
    expect((result.current as InferredPaginator).currentState).toEqual({
        pageSize: 5,
        page: 2,
    });
});
