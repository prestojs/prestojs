import { act, renderHook } from 'presto-testing-library';
import { useState } from 'react';
import CursorPaginator from '../pagination/CursorPaginator';
import InferredPaginator from '../pagination/InferredPaginator';
import LimitOffsetPaginator from '../pagination/LimitOffsetPaginator';
import PageNumberPaginator from '../pagination/PageNumberPaginator';

function useTestHook(initialState = {}): InferredPaginator {
    return new InferredPaginator(useState(initialState), useState());
}

test('should infer underlying paginator based on response', () => {
    let { result } = renderHook(() => useTestHook());
    expect(() => result.current.first()).toThrowError(/Cannot call/);
    expect(() => result.current.last()).toThrowError(/Cannot call/);
    expect(() => result.current.previous()).toThrowError(/Cannot call/);
    expect(() => result.current.next()).toThrowError(/Cannot call/);
    expect(() => result.current.setPage(1)).toThrowError(/Cannot call/);
    expect(() => result.current.setPageSize(1)).toThrowError(/Cannot call/);
    expect(() => result.current.setLimit(1)).toThrowError(/Cannot call/);
    expect(() => result.current.setOffset(1)).toThrowError(/Cannot call/);

    act(() =>
        result.current.setResponse({
            pageSize: 5,
            total: 10,
            results: [],
        })
    );
    expect(result.current.paginator).toBeInstanceOf(PageNumberPaginator);
    expect(result.current.nextState()).toEqual({ page: 2, pageSize: 5 });
    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ page: 2, pageSize: 5 });
    expect(result.current.previousState()).toEqual({ page: 1, pageSize: 5 });
    act(() => result.current.previous());
    expect(result.current.currentState).toEqual({ page: 1, pageSize: 5 });
    expect(result.current.pageSizeState(10)).toEqual({ page: 1, pageSize: 10 });
    act(() => result.current.setPageSize(10));
    expect(result.current.currentState).toEqual({ page: 1, pageSize: 10 });
    act(() => result.current.setPageSize(5));
    expect(result.current.pageState(2)).toEqual({ page: 2, pageSize: 5 });
    act(() => result.current.setPage(2));
    expect(result.current.currentState).toEqual({ page: 2, pageSize: 5 });

    result = renderHook(() => useTestHook()).result;
    act(() =>
        result.current.setResponse({
            limit: 5,
            total: 10,
            results: [],
        })
    );
    expect(result.current.paginator).toBeInstanceOf(LimitOffsetPaginator);
    expect(result.current.nextState()).toEqual({ limit: 5, offset: 5 });
    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ limit: 5, offset: 5 });
    expect(result.current.offsetState(0)).toEqual({ limit: 5 });
    act(() => result.current.setOffset(0));
    expect(result.current.currentState).toEqual({ limit: 5 });
    expect(result.current.limitState(10)).toEqual({ limit: 10 });
    act(() => result.current.setLimit(10));
    expect(result.current.currentState).toEqual({ limit: 10 });

    expect(result.current.paginator).toBeInstanceOf(LimitOffsetPaginator);

    result = renderHook(() => useTestHook()).result;
    act(() =>
        result.current.setResponse({
            pageSize: 5,
            nextCursor: 'abc123',
            results: [],
        })
    );
    expect(result.current.paginator).toBeInstanceOf(CursorPaginator);
    expect(result.current.nextState()).toEqual({ cursor: 'abc123', pageSize: 5 });
    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ cursor: 'abc123', pageSize: 5 });

    result = renderHook(() => useTestHook()).result;
    act(() =>
        result.current.setResponse({
            previousCursor: 'def456',
            results: [],
        })
    );
    expect(result.current.paginator).toBeInstanceOf(CursorPaginator);
    expect(result.current.previousState()).toEqual({ cursor: 'def456' });
    act(() => result.current.previous());
    expect(result.current.currentState).toEqual({ cursor: 'def456' });

    expect(result.current.paginator).toBeInstanceOf(CursorPaginator);
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

test('should support hasPreviousPage', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});

    expect(result.current.hasPreviousPage()).toBe(false);

    act(() => result.current.setResponse({ total: 30, pageSize: 10 }));

    expect(result.current.hasPreviousPage()).toBe(false);
    act(() => result.current.next());
    expect(result.current.hasPreviousPage()).toBe(true);
    act(() => result.current.next());
    expect(result.current.hasPreviousPage()).toBe(true);
    act(() => result.current.first());
    expect(result.current.hasPreviousPage()).toBe(false);
});

test('should infer correct paginator based on getPaginationState', () => {
    const defaultOptions = {
        url: 'a',
        requestInit: {},
        result: null,
        query: {},
    };
    let state = InferredPaginator.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            count: 10,
            results: [1, 2, 3, 4, 5],
            // LimitOffsetPaginator is only inferred if one of the urls contains offset or limit
            // This is to avoid conflicts with PageNumberPaginator which has the same structure.
            next: '?offset=5',
            previous: null,
        },
    });
    let { result } = renderHook(() => useTestHook());
    act(() => result.current.setResponse(state as Record<string, any>));
    expect(result.current.paginator).toBeInstanceOf(LimitOffsetPaginator);

    state = InferredPaginator.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            results: [1, 2, 3, 4, 5],
            next: null,
            previous: null,
        },
    });
    result = renderHook(() => useTestHook()).result;
    act(() => result.current.setResponse(state as Record<string, any>));
    expect(result.current.paginator).toBeInstanceOf(CursorPaginator);

    state = InferredPaginator.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            count: 10,
            next: '?page=2',
            results: [1, 2, 3, 4, 5],
        },
    });
    result = renderHook(() => useTestHook()).result;
    act(() => result.current.setResponse(state as Record<string, any>));
    expect(result.current.paginator).toBeInstanceOf(PageNumberPaginator);

    state = InferredPaginator.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            count: 5,
            next: null,
            previous: null,
            results: [1, 2, 3, 4, 5],
        },
    });
    result = renderHook(() => useTestHook()).result;
    act(() => result.current.setResponse(state as Record<string, any>));
    expect(result.current.paginator).toBeInstanceOf(PageNumberPaginator);
});
