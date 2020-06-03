import { act, renderHook } from '@testing-library/react-hooks';
import { useState } from 'react';
import LimitOffsetPaginator from '../pagination/LimitOffsetPaginator';

function useTestHook(initialState = {}): LimitOffsetPaginator {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return new LimitOffsetPaginator(useState(initialState), useState());
}

test('should set limit and offset in query', () => {
    // If no initial values provided should not add anything to query
    expect(
        renderHook(() => useTestHook()).result.current.getRequestInit({
            query: {},
        })
    ).toEqual({ query: {} });

    expect(
        renderHook(() => useTestHook({ limit: 5, offset: 5 })).result.current.getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            limit: 5,
            offset: 5,
        },
    });

    expect(
        renderHook(() => useTestHook({ limit: 5, offset: 10 })).result.current.getRequestInit({
            query: {
                keywords: 'abc',
            },
        })
    ).toEqual({
        query: {
            limit: 5,
            offset: 10,
            keywords: 'abc',
        },
    });
});

test('should handle changing pages', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});

    expect(result.current.firstState()).toEqual({});
    act(() => result.current.first());
    expect(result.current.currentState).toEqual({});

    const previousState = result.current.currentState;
    // should be no-op when total number of results not known
    act(() => result.current.last());
    expect(previousState).toBe(result.current.currentState);

    act(() => result.current.setResponse({ total: 30, limit: 10 }));

    expect(result.current.currentState).toEqual({ limit: 10 });
    expect(result.current.total).toBe(30);

    expect(result.current.lastState()).toEqual({ offset: 20, limit: 10 });
    act(() => result.current.last());
    expect(result.current.currentState).toEqual({ offset: 20, limit: 10 });

    expect(result.current.previousState()).toEqual({ offset: 10, limit: 10 });
    act(() => result.current.previous());
    expect(result.current.currentState).toEqual({ offset: 10, limit: 10 });
    act(() => result.current.previous());
    expect(result.current.currentState).toEqual({ limit: 10 });
    expect(result.current.nextState()).toEqual({ offset: 10, limit: 10 });
    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ offset: 10, limit: 10 });

    expect(result.current.offsetState(0)).toEqual({ limit: 10 });
    act(() => result.current.setOffset(0));
    expect(result.current.currentState).toEqual({ limit: 10 });
    expect(result.current.offsetState(20)).toEqual({ offset: 20, limit: 10 });
    act(() => result.current.setOffset(20));
    expect(result.current.currentState).toEqual({ offset: 20, limit: 10 });

    expect(result.current.getRequestInit({ query: {} })).toEqual({
        query: {
            offset: 20,
            limit: 10,
        },
    });

    expect(() => result.current.setOffset(-1)).toThrowError(/Invalid offset/);

    // Setting to null should just reset to default
    act(() => result.current.setOffset(null));
    expect(result.current.currentState).toEqual({ limit: 10 });
});

test('should handle changing limit', () => {
    const { result } = renderHook(() => useTestHook());
    expect(result.current.currentState).toEqual({});
    act(() => result.current.setLimit(10));
    expect(result.current.currentState).toEqual({ limit: 10 });
    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ limit: 10, offset: 10 });
    // Page size same shouldn't change anything
    act(() => result.current.setLimit(10));
    expect(result.current.currentState).toEqual({ limit: 10, offset: 10 });
    // Page size changed should alter offset such that it's still in step while
    // keeping existing result on the page
    act(() => result.current.setLimit(6));
    expect(result.current.currentState).toEqual({ limit: 6, offset: 6 });
    act(() => result.current.next());
    expect(result.current.currentState).toEqual({ limit: 6, offset: 12 });
    act(() => result.current.setLimit(10));
    expect(result.current.currentState).toEqual({ limit: 10, offset: 10 });

    expect(() => result.current.setLimit(0)).toThrowError(/Invalid/);

    // Setting to null should just reset to default
    act(() => result.current.setLimit(null));
    expect(result.current.currentState).toEqual({});
});

test('should set responseIsSet', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});
    expect(result.current.responseIsSet).toBe(false);
    act(() => result.current.setResponse({ total: 30, limit: 10 }));
    expect(result.current.responseIsSet).toBe(true);
});

test('should support hasNextPage', () => {
    const { result } = renderHook(() => useTestHook());

    expect(result.current.currentState).toEqual({});

    expect(result.current.hasNextPage()).toBe(false);

    act(() => result.current.setResponse({ total: 30, limit: 10 }));

    expect(result.current.hasNextPage()).toBe(true);
    act(() => result.current.next());
    expect(result.current.hasNextPage()).toBe(true);
    act(() => result.current.next());
    expect(result.current.hasNextPage()).toBe(false);
    act(() => result.current.first());
    expect(result.current.hasNextPage()).toBe(true);
});
