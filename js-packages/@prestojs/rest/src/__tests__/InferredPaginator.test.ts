import { useState } from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import InferredPaginator from '../InferredPaginator';
import LimitOffsetPaginator from '../LimitOffsetPaginator';
import PageNumberPaginator from '../PageNumberPaginator';
import CursorPaginator from '../CursorPaginator';

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
});
