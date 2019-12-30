import getPaginationState from '../getPaginationState';
import InferredPaginator from '../InferredPaginator';

const paginator = new InferredPaginator();

const defaultOptions = {
    url: 'a',
    requestInit: {},
    result: null,
    query: {},
};

test('identifies page number pagination', () => {
    let state = getPaginationState(paginator, {
        ...defaultOptions,
        decodedBody: {
            count: 10,
            results: new Array(5),
        },
    });
    expect(state).toEqual({ total: 10, results: new Array(5), pageSize: 5 });

    // If pageSize is in response should use that
    state = getPaginationState(paginator, {
        ...defaultOptions,
        decodedBody: {
            count: 5,
            results: [],
            pageSize: 5,
        },
    });
    expect(state).toEqual({ total: 5, results: [], pageSize: 5 });
});

test('identifies limit/offset pagination', () => {
    let state = getPaginationState(paginator, {
        ...defaultOptions,
        decodedBody: {
            count: 5,
            results: [],
            next: 'http://localhost/?limit=5',
        },
    });
    expect(state).toEqual({ limit: 5, total: 5, results: [] });

    state = getPaginationState(paginator, {
        ...defaultOptions,
        decodedBody: {
            count: 5,
            results: [],
            previous: 'http://localhost/?limit=10',
        },
    });
    expect(state).toEqual({ limit: 10, total: 5, results: [] });
});

test('identifies cursor pagination', () => {
    let state = getPaginationState(paginator, {
        ...defaultOptions,
        decodedBody: {
            results: [],
            next: 'http://localhost/?cursor=a',
        },
    });
    expect(state).toEqual({ nextCursor: 'a', results: [], previousCursor: null });

    state = getPaginationState(paginator, {
        ...defaultOptions,
        decodedBody: {
            results: [],
            previous: 'http://localhost/?cursor=b',
        },
    });
    expect(state).toEqual({ previousCursor: 'b', results: [], nextCursor: null });
    state = getPaginationState(paginator, {
        ...defaultOptions,
        decodedBody: {
            results: [],
            previous: 'http://localhost/?cursor=b',
            next: 'http://localhost/?cursor=a',
        },
    });
    expect(state).toEqual({ previousCursor: 'b', results: [], nextCursor: 'a' });

    state = getPaginationState(paginator, {
        ...defaultOptions,
        decodedBody: {
            results: [],
            pageSize: 5,
            previous: 'http://localhost/?cursor=b',
            next: 'http://localhost/?cursor=a',
        },
    });
    expect(state).toEqual({ previousCursor: 'b', results: [], nextCursor: 'a', pageSize: 5 });
});
