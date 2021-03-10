import { UrlPattern } from '@prestojs/routing';
import { InferredPaginator, PageNumberPaginator, usePaginator } from '@prestojs/util';
import { PaginatorClassProvider } from '@prestojs/util/build/module/pagination/usePaginator';
import { act, renderHook } from '@testing-library/react-hooks';
import Endpoint from '../Endpoint';
import paginationMiddleware from '../paginationMiddleware';

test('should accept endpoint', async () => {
    const action1 = new Endpoint(new UrlPattern('/whatever/'), {
        middleware: [paginationMiddleware()],
    });
    const { result } = renderHook(() =>
        usePaginator((action1 as unknown) as PaginatorClassProvider<any>)
    );

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
    let action1: null | Endpoint = null;
    const { result, rerender } = renderHook(() =>
        usePaginator((action1 as unknown) as PaginatorClassProvider<any>)
    );

    expect(result.current).toBe(null);

    action1 = new Endpoint(new UrlPattern('/whatever/'), {
        middleware: [paginationMiddleware()],
    });
    rerender();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
