import { UrlPattern } from '@prestojs/routing';
import { InferredPaginator, PageNumberPaginator, usePaginator } from '@prestojs/util';
import { act, renderHook } from '@testing-library/react-hooks';
import PaginatedEndpoint from '../PaginatedEndpoint';

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
