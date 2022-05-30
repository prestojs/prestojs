import { act, renderHook } from 'presto-testing-library';
import { useState } from 'react';
import InferredPaginator from '../pagination/InferredPaginator';
import PageNumberPaginator from '../pagination/PageNumberPaginator';

function useTestHook(initialState = {}): PageNumberPaginator {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new PageNumberPaginator(useState(initialState), useState());
}

test('should set page and pageSize in query', () => {
    // If no initial values provided should not add anything to query
    expect(
        renderHook(() => useTestHook()).result.current.getRequestInit({
            query: {},
        })
    ).toEqual({ query: {} });

    expect(
        renderHook(() => useTestHook({ page: 2 })).result.current.getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            page: 2,
        },
    });

    expect(
        renderHook(() => useTestHook({ pageSize: 10 })).result.current.getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            pageSize: 10,
        },
    });

    expect(
        renderHook(() => useTestHook({ pageSize: 10, page: 2 })).result.current.getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            pageSize: 10,
            page: 2,
        },
    });

    expect(
        renderHook(() => useTestHook({ pageSize: 10, page: 2 })).result.current.getRequestInit({
            query: {
                keywords: 'abc',
            },
        })
    ).toEqual({
        query: {
            pageSize: 10,
            page: 2,
            keywords: 'abc',
        },
    });
});

test('should handle changing pages', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});

    act(() => result.current.first());
    expect(result.current.currentState).toEqual({ page: 1 });

    expect(result.current.lastState()).toBe(null);

    // no-op
    act(() => result.current.last());
    expect(result.current.currentState).toEqual({ page: 1 });

    act(() => result.current.setResponse({ total: 30, pageSize: 10 }));

    expect(result.current.firstState()).toEqual({ page: 1, pageSize: 10 });

    expect(result.current.currentState).toEqual({ page: 1, pageSize: 10 });
    expect(result.current.total).toBe(30);

    expect(result.current.lastState()).toEqual({ page: 3, pageSize: 10 });
    act(() => result.current.last());
    expect(result.current.currentState).toEqual({ page: 3, pageSize: 10 });

    expect(result.current.previousState()).toEqual({ page: 2, pageSize: 10 });
    act(() => result.current.previous());
    expect(result.current.currentState).toEqual({ page: 2, pageSize: 10 });
    act(() => result.current.previous());
    expect(result.current.currentState).toEqual({ page: 1, pageSize: 10 });

    expect(result.current.nextState()).toEqual({ page: 2, pageSize: 10 });
    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ page: 2, pageSize: 10 });

    expect(result.current.pageState(1)).toEqual({ page: 1, pageSize: 10 });
    act(() => result.current.setPage(1));
    expect(result.current.currentState).toEqual({ page: 1, pageSize: 10 });
    expect(result.current.pageState(3)).toEqual({ page: 3, pageSize: 10 });
    act(() => result.current.setPage(3));
    expect(result.current.currentState).toEqual({ page: 3, pageSize: 10 });

    expect(result.current.getRequestInit({ query: {} })).toEqual({
        query: {
            page: 3,
            pageSize: 10,
        },
    });

    expect(() => result.current.setPage(0)).toThrowError(/Invalid page/);
});

test('should handle changing page size', () => {
    const { result } = renderHook(() => useTestHook());
    expect(result.current.currentState).toEqual({});
    act(() => result.current.setPageSize(10));
    expect(result.current.pageSizeState(10)).toEqual({ pageSize: 10 });
    expect(result.current.currentState).toEqual({ pageSize: 10 });
    act(() => result.current.setResponse({ total: 20 }));
    expect(result.current.currentState).toEqual({ pageSize: 10 });
    act(() => result.current.setPageSize(5));
    expect(result.current.currentState).toEqual({ page: 1, pageSize: 5 });
    act(() => result.current.setPage(2));
    expect(result.current.currentState).toEqual({ pageSize: 5, page: 2 });
    // Page size same shouldn't change anything
    act(() => result.current.setPageSize(5));
    expect(result.current.currentState).toEqual({ pageSize: 5, page: 2 });
    // Page size changed should reset to page 1
    act(() => result.current.setPageSize(2));
    expect(result.current.pageSizeState(2)).toEqual({ pageSize: 2, page: 3 });
    expect(result.current.currentState).toEqual({ pageSize: 2, page: 3 });

    expect(() => result.current.setPageSize(0)).toThrowError(/Invalid/);

    // Setting to null should just reset to default
    act(() => result.current.setPageSize(null));
    expect(result.current.currentState).toEqual({});
});

test('should set responseIsSet', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});
    expect(result.current.responseIsSet).toBe(false);
    act(() => result.current.setResponse({ total: 30, pageSize: 10 }));
    expect(result.current.responseIsSet).toBe(true);
});

test('should support hasNextPage', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});

    expect(result.current.hasNextPage()).toBe(false);

    act(() => result.current.setResponse({ total: 30, pageSize: 10 }));
    expect(result.current.hasNextPage()).toBe(true);
    act(() => result.current.next());
    expect(result.current.hasNextPage()).toBe(true);
    act(() => result.current.next());
    expect(result.current.hasNextPage()).toBe(false);
    act(() => result.current.first());
    expect(result.current.hasNextPage()).toBe(true);
});

test.each`
    paginatorClass
    ${PageNumberPaginator}
    ${InferredPaginator}
`(' identifies page number pagination ($paginatorClass)', ({ paginatorClass }) => {
    const defaultOptions = {
        url: 'a',
        requestInit: {},
        result: null,
        query: {},
    };

    let state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            count: 10,
            results: new Array(5),
        },
    });
    expect(state).toEqual({ total: 10, results: new Array(5), pageSize: 5 });

    // If pageSize is in response should use that
    state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            count: 5,
            results: [],
            pageSize: 5,
        },
    });
    expect(state).toEqual({ total: 5, results: [], pageSize: 5 });

    // Accept `total` directly instead of `count`
    state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            total: 10,
            results: new Array(5),
        },
    });
    expect(state).toEqual({ total: 10, results: new Array(5), pageSize: 5 });

    // If pageSize is in response should use that
    state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            total: 0,
            results: [],
            pageSize: 5,
        },
    });
    expect(state).toEqual({ total: 0, results: [], pageSize: 5 });
});
