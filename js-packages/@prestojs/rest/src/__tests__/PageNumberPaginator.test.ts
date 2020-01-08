import PageNumberPaginator from '../PageNumberPaginator';

test('should set page and pageSize in query', () => {
    // If no initial values provided should not add anything to query
    expect(
        new PageNumberPaginator().getRequestInit({
            query: {},
        })
    ).toEqual({ query: {} });

    expect(
        new PageNumberPaginator({ page: 2 }).getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            page: 2,
        },
    });

    expect(
        new PageNumberPaginator({ pageSize: 10 }).getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            pageSize: 10,
        },
    });

    expect(
        new PageNumberPaginator({ pageSize: 10, page: 2 }).getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            pageSize: 10,
            page: 2,
        },
    });

    expect(
        new PageNumberPaginator({ pageSize: 10, page: 2 }).getRequestInit({
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
    const paginator = new PageNumberPaginator();

    expect(paginator.currentState).toEqual({});

    paginator.first();
    expect(paginator.currentState).toEqual({ page: 1 });

    expect(() => paginator.last()).toThrowError(
        /Cannot go to last page until pageSize and total number of results is known/
    );

    paginator.setResponse({ total: 30, pageSize: 10 });

    expect(paginator.currentState).toEqual({ page: 1, pageSize: 10 });
    expect(paginator.total).toBe(30);

    paginator.last();
    expect(paginator.currentState).toEqual({ page: 3, pageSize: 10 });

    paginator.previous();
    expect(paginator.currentState).toEqual({ page: 2, pageSize: 10 });
    paginator.previous();
    expect(paginator.currentState).toEqual({ page: 1, pageSize: 10 });
    paginator.next();
    expect(paginator.currentState).toEqual({ page: 2, pageSize: 10 });
    paginator.gotoPage(1);
    expect(paginator.currentState).toEqual({ page: 1, pageSize: 10 });
    paginator.gotoPage(3);
    expect(paginator.currentState).toEqual({ page: 3, pageSize: 10 });

    expect(paginator.getRequestInit({ query: {} })).toEqual({
        query: {
            page: 3,
            pageSize: 10,
        },
    });

    expect(() => paginator.gotoPage(0)).toThrowError(/Invalid page/);
});

test('should handle changing page size', () => {
    const paginator = new PageNumberPaginator();
    expect(paginator.currentState).toEqual({});
    paginator.setPageSize(10);
    expect(paginator.currentState).toEqual({ pageSize: 10 });
    paginator.setResponse({ total: 20 });
    expect(paginator.currentState).toEqual({ pageSize: 10 });
    paginator.setPageSize(5);
    expect(paginator.currentState).toEqual({ pageSize: 5 });
    paginator.gotoPage(2);
    expect(paginator.currentState).toEqual({ pageSize: 5, page: 2 });
    // Page size same shouldn't change anything
    paginator.setPageSize(5);
    expect(paginator.currentState).toEqual({ pageSize: 5, page: 2 });
    // Page size changed should reset to page 1
    paginator.setPageSize(10);
    expect(paginator.currentState).toEqual({ pageSize: 10, page: 1 });
    expect(paginator.getRequestInit({ query: {} })).toEqual({
        query: {
            page: 1,
            pageSize: 10,
        },
    });

    expect(() => paginator.setPageSize(0)).toThrowError(/Invalid/);
});

test('should handle syncing state', () => {
    const paginator = new PageNumberPaginator();

    paginator.syncState({ page: 5 });
    expect(paginator.currentState).toEqual({ page: 5 });
    paginator.next();
    expect(paginator.currentState).toEqual({ page: 6 });
    const prevState = paginator.currentState;
    paginator.syncState({ page: 6 });
    expect(paginator.currentState).toBe(prevState);

    paginator.syncState({ pageSize: 10 });
    expect(paginator.currentState).toEqual({ page: 6, pageSize: 10 });
});
