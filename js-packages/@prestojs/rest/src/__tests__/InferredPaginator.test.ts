import InferredPaginator from '../InferredPaginator';
import LimitOffsetPaginator from '../LimitOffsetPaginator';
import PageNumberPaginator from '../PageNumberPaginator';
import CursorPaginator from '../CursorPaginator';

test('should infer underlying paginator based on response', () => {
    let paginator = new InferredPaginator();
    expect(() => paginator.first()).toThrowError(/Cannot call/);
    expect(() => paginator.last()).toThrowError(/Cannot call/);
    expect(() => paginator.previous()).toThrowError(/Cannot call/);
    expect(() => paginator.next()).toThrowError(/Cannot call/);
    expect(() => paginator.gotoPage(1)).toThrowError(/Cannot call/);
    expect(() => paginator.setPageSize(1)).toThrowError(/Cannot call/);
    expect(() => paginator.setLimit(1)).toThrowError(/Cannot call/);
    expect(() => paginator.setOffset(1)).toThrowError(/Cannot call/);

    paginator.setResponse({
        pageSize: 5,
        total: 10,
        results: [],
    });
    expect(paginator.paginator).toBeInstanceOf(PageNumberPaginator);
    paginator.next();
    expect(paginator.currentState).toEqual({ page: 2, pageSize: 5 });
    paginator.previous();
    expect(paginator.currentState).toEqual({ page: 1, pageSize: 5 });
    paginator.setPageSize(10);
    expect(paginator.currentState).toEqual({ page: 1, pageSize: 10 });
    paginator.setPageSize(5);
    paginator.gotoPage(2);
    expect(paginator.currentState).toEqual({ page: 2, pageSize: 5 });

    paginator = new InferredPaginator();
    paginator.setResponse({
        limit: 5,
        total: 10,
        results: [],
    });
    expect(paginator.paginator).toBeInstanceOf(LimitOffsetPaginator);
    paginator.next();
    expect(paginator.currentState).toEqual({ limit: 5, offset: 5 });
    paginator.setOffset(0);
    expect(paginator.currentState).toEqual({ limit: 5 });
    paginator.setLimit(10);
    expect(paginator.currentState).toEqual({ limit: 10 });

    paginator = new InferredPaginator();
    paginator.setResponse({
        pageSize: 5,
        nextCursor: 'abc123',
        results: [],
    });
    expect(paginator.paginator).toBeInstanceOf(CursorPaginator);
    paginator.next();
    expect(paginator.currentState).toEqual({ cursor: 'abc123', pageSize: 5 });

    paginator = new InferredPaginator();
    paginator.setResponse({
        previousCursor: 'def456',
        results: [],
    });
    expect(paginator.paginator).toBeInstanceOf(CursorPaginator);
    paginator.previous();
    expect(paginator.currentState).toEqual({ cursor: 'def456' });
});
