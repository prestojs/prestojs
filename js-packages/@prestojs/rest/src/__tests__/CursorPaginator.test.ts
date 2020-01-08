import CursorPaginator from '../CursorPaginator';

test('should set cursor in query', () => {
    // If no initial values provided should not add anything to query
    expect(
        new CursorPaginator().getRequestInit({
            query: {},
        })
    ).toEqual({ query: {} });

    expect(
        new CursorPaginator({ cursor: 'abc123' }).getRequestInit({
            query: {},
        })
    ).toEqual({
        query: {
            cursor: 'abc123',
        },
    });

    expect(
        new CursorPaginator({ cursor: 'abc123' }).getRequestInit({
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
    const paginator = new CursorPaginator();

    expect(paginator.currentState).toEqual({});

    expect(() => paginator.next()).toThrowError(
        /Cannot go to next page as next cursor is not known/
    );

    paginator.setResponse({ nextCursor: 'abc123', pageSize: 10 });

    expect(paginator.currentState).toEqual({ pageSize: 10 });
    expect(paginator.nextCursor).toBe('abc123');

    paginator.next();
    expect(paginator.currentState).toEqual({ pageSize: 10, cursor: 'abc123' });
    paginator.setResponse({ previousCursor: '0', nextCursor: 'def456' });

    paginator.previous();
    expect(paginator.currentState).toEqual({ cursor: '0', pageSize: 10 });
    paginator.setResponse({ nextCursor: 'abc123', pageSize: 10 });
    paginator.next();
    expect(paginator.currentState).toEqual({ cursor: 'abc123', pageSize: 10 });
    paginator.first();
    expect(paginator.currentState).toEqual({ pageSize: 10 });

    expect(paginator.getRequestInit({ query: {} })).toEqual({
        query: {
            pageSize: 10,
        },
    });

    paginator.nextCursor = null;
    paginator.previousCursor = null;

    expect(() => paginator.next()).toThrowError(
        /Cannot go to next page as next cursor is not known/
    );
    expect(() => paginator.previous()).toThrowError(
        /Cannot go to previous page as previous cursor is not known/
    );
});

test('should handle changing page size', () => {
    const paginator = new CursorPaginator();
    expect(paginator.currentState).toEqual({});
    paginator.setPageSize(10);
    expect(paginator.currentState).toEqual({ pageSize: 10 });
    paginator.setResponse({ nextCursor: 'abc123', previousCursor: null });
    expect(paginator.currentState).toEqual({ pageSize: 10 });
    expect(paginator.nextCursor).toBe('abc123');
    paginator.setPageSize(5);
    expect(paginator.nextCursor).toBe(null);
    paginator.setResponse({ nextCursor: 'abc123', previousCursor: null });
    paginator.next();
    expect(paginator.currentState).toEqual({ pageSize: 5, cursor: 'abc123' });
    // Page size same shouldn't change anything
    paginator.setPageSize(5);
    expect(paginator.currentState).toEqual({ pageSize: 5, cursor: 'abc123' });
    // Page size changed should not reset cursor
    paginator.setPageSize(10);
    expect(paginator.currentState).toEqual({ pageSize: 10, cursor: 'abc123' });
    expect(paginator.getRequestInit({ query: {} })).toEqual({
        query: {
            cursor: 'abc123',
            pageSize: 10,
        },
    });

    expect(() => paginator.setPageSize(0)).toThrowError(/Invalid/);

    // Setting to null should just reset to default
    paginator.setPageSize(null);
    expect(paginator.currentState).toEqual({ cursor: 'abc123' });
});

test('should handle syncing state', () => {
    const paginator = new CursorPaginator();
    paginator.syncState({ cursor: 'abc123' });
    expect(paginator.currentState).toEqual({ cursor: 'abc123' });
    const prevState = paginator.currentState;
    paginator.syncState({ cursor: 'abc123' });
    expect(paginator.currentState).toBe(prevState);

    paginator.syncState({ pageSize: 10 });
    expect(paginator.currentState).toEqual({ cursor: 'abc123', pageSize: 10 });
});
