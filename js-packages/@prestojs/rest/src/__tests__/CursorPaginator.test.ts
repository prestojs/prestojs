import { act, renderHook } from '@testing-library/react-hooks';
import { useState } from 'react';
import CursorPaginator from '../CursorPaginator';

function useTestHook(initialState = {}): CursorPaginator {
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
