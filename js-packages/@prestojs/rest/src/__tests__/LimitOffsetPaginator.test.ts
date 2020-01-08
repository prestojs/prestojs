import LimitOffsetPaginator from '../LimitOffsetPaginator';

test('should set limit and offset in query', () => {
    // If no initial values provided should not add anything to query
    expect(
        new LimitOffsetPaginator().getRequestInit({
            query: {},
        })
    ).toEqual({ query: {} });

    expect(
        new LimitOffsetPaginator({ limit: 5, offset: 5 }).getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            limit: 5,
            offset: 5,
        },
    });

    expect(
        new LimitOffsetPaginator({ limit: 5, offset: 10 }).getRequestInit({
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
    const paginator = new LimitOffsetPaginator();

    expect(paginator.currentState).toEqual({});

    paginator.first();
    expect(paginator.currentState).toEqual({});

    expect(() => paginator.last()).toThrowError(
        /Cannot go to last page until limit and total number of results is known/
    );

    paginator.setResponse({ total: 30, limit: 10 });

    expect(paginator.currentState).toEqual({ limit: 10 });
    expect(paginator.total).toBe(30);

    paginator.last();
    expect(paginator.currentState).toEqual({ offset: 20, limit: 10 });

    paginator.previous();
    expect(paginator.currentState).toEqual({ offset: 10, limit: 10 });
    paginator.previous();
    expect(paginator.currentState).toEqual({ limit: 10 });
    paginator.next();
    expect(paginator.currentState).toEqual({ offset: 10, limit: 10 });
    paginator.setOffset(0);
    expect(paginator.currentState).toEqual({ limit: 10 });
    paginator.setOffset(20);
    expect(paginator.currentState).toEqual({ offset: 20, limit: 10 });

    expect(paginator.getRequestInit({ query: {} })).toEqual({
        query: {
            offset: 20,
            limit: 10,
        },
    });

    expect(() => paginator.setOffset(-1)).toThrowError(/Invalid offset/);
});

test('should handle changing limit', () => {
    const paginator = new LimitOffsetPaginator();
    expect(paginator.currentState).toEqual({});
    paginator.setLimit(10);
    expect(paginator.currentState).toEqual({ limit: 10 });
    paginator.next();
    expect(paginator.currentState).toEqual({ limit: 10, offset: 10 });
    // Page size same shouldn't change anything
    paginator.setLimit(10);
    expect(paginator.currentState).toEqual({ limit: 10, offset: 10 });
    // Page size changed should alter offset such that it's still in step while
    // keeping existing result on the page
    paginator.setLimit(6);
    expect(paginator.currentState).toEqual({ limit: 6, offset: 6 });
    paginator.next();
    expect(paginator.currentState).toEqual({ limit: 6, offset: 12 });
    paginator.setLimit(10);
    expect(paginator.currentState).toEqual({ limit: 10, offset: 10 });

    expect(() => paginator.setLimit(0)).toThrowError(/Invalid/);

    // Setting to null should just reset to default
    paginator.setLimit(null);
    expect(paginator.currentState).toEqual({});
});

test('should handle syncing state', () => {
    const paginator = new LimitOffsetPaginator();

    paginator.syncState({ limit: 5 });
    expect(paginator.currentState).toEqual({ limit: 5 });
    paginator.next();
    expect(paginator.currentState).toEqual({ limit: 5, offset: 5 });
    const prevState = paginator.currentState;
    paginator.syncState({ limit: 5 });
    expect(paginator.currentState).toBe(prevState);

    paginator.syncState({ limit: 10, offset: 10 });
    expect(paginator.currentState).toEqual({ limit: 10, offset: 10 });
});
