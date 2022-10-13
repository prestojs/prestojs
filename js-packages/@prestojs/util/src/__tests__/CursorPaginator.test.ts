import { act, renderHook } from 'presto-testing-library';
import { useState } from 'react';
import CursorPaginator from '../pagination/CursorPaginator';
import InferredPaginator from '../pagination/InferredPaginator';

function useTestHook(initialState = {}): CursorPaginator {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new CursorPaginator(useState(initialState), useState());
}

test('should set cursor in query', () => {
    // If no initial values provided should not add anything to query
    expect(
        renderHook(() => useTestHook()).result.current.getRequestInit({
            query: {},
        })
    ).toEqual({ query: {} });

    expect(
        renderHook(() => useTestHook({ cursor: 'abc123' })).result.current.getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            cursor: 'abc123',
        },
    });

    expect(
        renderHook(() => useTestHook({ cursor: 'abc123' })).result.current.getRequestInit({
            query: {
                keywords: 'abc',
            },
        })
    ).toEqual({
        query: {
            cursor: 'abc123',
            keywords: 'abc',
        },
    });
});

test('should handle changing pages', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});

    act(() => result.current.setResponse({ nextCursor: 'abc123', pageSize: 10 }));

    expect(result.current.currentState).toEqual({ pageSize: 10 });
    expect(result.current.nextCursor).toBe('abc123');

    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ pageSize: 10, cursor: 'abc123' });
    act(() => result.current.setResponse({ previousCursor: '0', nextCursor: 'def456' }));

    expect(result.current.previousState()).toEqual({ cursor: '0', pageSize: 10 });
    act(() => result.current.previous());
    expect(result.current.currentState).toEqual({ cursor: '0', pageSize: 10 });

    act(() => result.current.setResponse({ nextCursor: 'abc123', pageSize: 10 }));
    expect(result.current.nextState()).toEqual({ cursor: 'abc123', pageSize: 10 });
    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ cursor: 'abc123', pageSize: 10 });

    expect(result.current.firstState()).toEqual({ pageSize: 10 });
    act(() => result.current.first());
    expect(result.current.currentState).toEqual({ pageSize: 10 });

    expect(result.current.getRequestInit({ query: {} })).toEqual({
        query: {
            pageSize: 10,
        },
    });

    act(() => result.current.setInternalState({ nextCursor: null, previousCursor: null }));
    const previousState = result.current.currentState;

    expect(result.current.nextState()).toBe(null);
    expect(result.current.previousState()).toBe(null);

    // These should be no-ops when nextCursor/previousCursor not known
    act(() => result.current.next());
    expect(previousState).toBe(result.current.currentState);
    act(() => result.current.previous());
    expect(previousState).toBe(result.current.currentState);
});

test('should handle changing page size', () => {
    const { result } = renderHook(() => useTestHook());
    expect(result.current.currentState).toEqual({});
    act(() => result.current.setPageSize(10));
    expect(result.current.currentState).toEqual({ pageSize: 10 });
    act(() => result.current.setResponse({ nextCursor: 'abc123', previousCursor: null }));
    expect(result.current.currentState).toEqual({ pageSize: 10 });
    expect(result.current.nextCursor).toBe('abc123');
    act(() => result.current.setPageSize(5));
    expect(result.current.nextCursor).toBe(null);
    act(() => result.current.setResponse({ nextCursor: 'abc123', previousCursor: null }));
    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ pageSize: 5, cursor: 'abc123' });
    // Page size same shouldn't change anything
    act(() => result.current.setPageSize(5));
    expect(result.current.currentState).toEqual({ pageSize: 5, cursor: 'abc123' });
    // Page size changed should not reset cursor
    act(() => result.current.setPageSize(10));
    expect(result.current.currentState).toEqual({ pageSize: 10, cursor: 'abc123' });
    expect(result.current.getRequestInit({ query: {} })).toEqual({
        query: {
            cursor: 'abc123',
            pageSize: 10,
        },
    });

    expect(() => result.current.setPageSize(0)).toThrowError(/Invalid/);

    // Setting to null should just reset to default
    act(() => result.current.setPageSize(null));
    expect(result.current.currentState).toEqual({ cursor: 'abc123' });
});

test('should set responseIsSet', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});
    expect(result.current.responseIsSet).toBe(false);
    act(() => result.current.setResponse({ nextCursor: 'abc123', pageSize: 10 }));
    expect(result.current.responseIsSet).toBe(true);
});

test('should support hasNextPage', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});

    expect(result.current.hasNextPage()).toBe(false);

    act(() => result.current.setResponse({ nextCursor: 'abc123', pageSize: 10 }));

    expect(result.current.hasNextPage()).toBe(true);

    act(() => result.current.next());
    act(() => result.current.setResponse({ pageSize: 10 }));
    expect(result.current.hasNextPage()).toBe(false);
});

test('should support hasPreviousPage', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});

    expect(result.current.hasPreviousPage()).toBe(false);

    act(() => result.current.setResponse({ nextCursor: 'abc123', pageSize: 10 }));

    expect(result.current.hasPreviousPage()).toBe(false);
    act(() => result.current.next());
    act(() => result.current.setResponse({ pageSize: 10, previousCursor: 'abc012' }));
    expect(result.current.hasPreviousPage()).toBe(true);
    act(() => result.current.setResponse({ pageSize: 10, previousCursor: null }));
    expect(result.current.hasPreviousPage()).toBe(false);
});

test.each`
    paginatorClass
    ${CursorPaginator}
    ${InferredPaginator}
`(' identifies cursorpagination($paginatorClass)', ({ paginatorClass }) => {
    const defaultOptions = {
        url: 'a',
        requestInit: {},
        result: null,
        query: {},
    };
    let state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            results: [],
            next: 'http://localhost/?cursor=a',
            previous: null,
        },
    });
    expect(state).toEqual({ nextCursor: 'a', results: [], previousCursor: null });

    state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            results: [],
            next: null,
            previous: 'http://localhost/?cursor=b',
        },
    });
    expect(state).toEqual({ previousCursor: 'b', results: [], nextCursor: null });
    state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            results: [],
            previous: 'http://localhost/?cursor=b',
            next: 'http://localhost/?cursor=a',
        },
    });
    expect(state).toEqual({ previousCursor: 'b', results: [], nextCursor: 'a' });

    state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            results: [],
            pageSize: 5,
            previous: 'http://localhost/?cursor=b',
            next: 'http://localhost/?cursor=a',
        },
    });
    expect(state).toEqual({ previousCursor: 'b', results: [], nextCursor: 'a', pageSize: 5 });

    state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            results: [],
            previous: null,
            next: null,
        },
    });
    expect(state).toEqual({ previousCursor: null, results: [], nextCursor: null });

    state = paginatorClass.getPaginationState({
        ...defaultOptions,
        decodedBody: {
            count: 0,
            results: [],
            previous: '?limit=0',
            next: null,
        },
    });
    expect(state).toEqual(
        CursorPaginator === paginatorClass ? false : { limit: 0, results: [], total: 0 }
    );
});
