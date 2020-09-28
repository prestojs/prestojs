import { UrlPattern } from '@prestojs/routing';
import {
    InferredPaginator,
    LimitOffsetPaginator,
    PageNumberPaginator,
    PaginatorInterface,
    PaginatorInterfaceClass,
} from '@prestojs/util';
import { renderHook } from '@testing-library/react-hooks';
import { FetchMock } from 'jest-fetch-mock';
import { useState } from 'react';
import { act } from 'react-test-renderer';
import Endpoint, { ApiError, RequestError } from '../Endpoint';
import paginationMiddleware from '../paginationMiddleware';

const fetchMock = fetch as FetchMock;

function useTestHook(
    paginatorClass: PaginatorInterfaceClass,
    initialState = {}
): PaginatorInterface {
    return new paginatorClass(useState(initialState), useState());
}

beforeEach(() => {
    fetchMock.resetMocks();
    Endpoint.defaultConfig.requestInit = {};
    Endpoint.defaultConfig.middleware = [];
});

test('prepare should maintain equality based on inputs', () => {
    const action = new Endpoint(new UrlPattern('/whatever/:id?/'));
    const a = action.prepare();
    expect(a).toBe(action.prepare());
    const b = action.prepare({ query: { a: 'b' } });
    expect(a).not.toBe(b);
    expect(b).toBe(action.prepare({ query: { a: 'b' } }));
    expect(b).not.toBe(action.prepare({ query: { a: 'c' } }));
    const c = action.prepare({ urlArgs: { id: 1 } });
    const d = action.prepare({ urlArgs: { id: 2 } });
    expect(c).not.toBe(d);
    expect(c).not.toBe(a);
    expect(c).toBe(action.prepare({ urlArgs: { id: 1 } }));

    const eArgs = { urlArgs: { id: 1 }, body: JSON.stringify({ a: 1, b: 2 }) };
    const e = action.prepare(eArgs);
    expect(e).toBe(action.prepare(eArgs));

    const fArgs = { urlArgs: { id: 1 }, headers: { Accept: 'application/json' } };
    const f = action.prepare(fArgs);
    expect(f).toBe(action.prepare(fArgs));
    expect(e).not.toBe(a);

    // Paginator should be factored into equality checks
    const noop = (): void => undefined;
    const gArgs = {
        urlArgs: { id: 1 },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        paginator: new PageNumberPaginator([{}, noop], [{}, noop]),
    };
    const g = action.prepare(gArgs);
    expect(g).toBe(action.prepare(gArgs));
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    gArgs.paginator = new PageNumberPaginator([{}, noop], [{}, noop]);
    expect(g).not.toBe(action.prepare(gArgs));
});

test('should resolve URLs', () => {
    fetchMock.mockResponse('');
    const action = new Endpoint(new UrlPattern('/whatever/:id?/'));
    action.prepare().execute();
    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual('/whatever/');
    action.prepare({ urlArgs: { id: 2 } }).execute();
    expect(fetchMock.mock.calls.length).toEqual(2);
    expect(fetchMock.mock.calls[1][0]).toEqual('/whatever/2/');
    action.prepare({ urlArgs: { id: 2 }, query: { a: 'b' } }).execute();
    expect(fetchMock.mock.calls.length).toEqual(3);
    expect(fetchMock.mock.calls[2][0]).toEqual('/whatever/2/?a=b');
    action.prepare({ query: { a: 'b' } }).execute();
    expect(fetchMock.mock.calls.length).toEqual(4);
    expect(fetchMock.mock.calls[3][0]).toEqual('/whatever/?a=b');
});

test('should support calling execute without prepare', () => {
    fetchMock.mockResponse('');
    const action = new Endpoint(new UrlPattern('/whatever/:id?/'));
    action.execute();
    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual('/whatever/');
    action.execute({ urlArgs: { id: 2 } });
    expect(fetchMock.mock.calls.length).toEqual(2);
    expect(fetchMock.mock.calls[1][0]).toEqual('/whatever/2/');
    action.execute({ urlArgs: { id: 2 }, query: { a: 'b' } });
    expect(fetchMock.mock.calls.length).toEqual(3);
    expect(fetchMock.mock.calls[2][0]).toEqual('/whatever/2/?a=b');
    action.execute({ query: { a: 'b' } });
    expect(fetchMock.mock.calls.length).toEqual(4);
    expect(fetchMock.mock.calls[3][0]).toEqual('/whatever/?a=b');
});

test('should support middleware function', async () => {
    fetchMock.mockResponseOnce('hello world', {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
    const action1 = new Endpoint(new UrlPattern('/whatever/'), {
        middleware: [
            async (url, requestInit, next): Promise<string> => {
                return (await next(url, requestInit)).toUpperCase();
            },
        ],
    });
    expect((await action1.prepare().execute()).result).toBe('HELLO WORLD');
    const action2 = new Endpoint(new UrlPattern('/whatever/'), {
        middleware: [
            async (url, requestInit, next): Promise<Record<string, any>> => {
                const data: Record<string, any> = await next(url, requestInit);
                return Object.entries(data).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});
            },
        ],
    });
    fetchMock.mockResponseOnce(JSON.stringify({ a: 'b', c: 'd' }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    expect((await action2.prepare().execute()).result).toEqual({ b: 'a', d: 'c' });
});

test('should support merging endpoint options and execute options', async () => {
    fetchMock.mockResponse(request => {
        return Promise.resolve({
            body: request.method,
            init: {
                status: 200,
                headers: {
                    'Content-Type': 'text/html',
                },
            },
        });
    });
    const action1 = new Endpoint(new UrlPattern('/whatever/'), {
        method: 'POST',
    });
    expect((await action1.execute()).result).toBe('POST');
    expect((await action1.execute({ method: 'PATCH' })).result).toBe('PATCH');
});

test('should support merging global headers with action specific headers', async () => {
    fetchMock.mockResponse('');
    const expectHeadersEqual = (headers2): void => {
        const headers1 = new Headers(
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1].headers
        );
        headers2 = new Headers(headers2);

        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        expect([...headers1.entries()]).toEqual([...headers2.entries()]);
    };
    const action1 = new Endpoint(new UrlPattern('/whatever/:id?/'));
    action1.prepare({ headers: { c: 'd' } }).execute({
        headers: { a: 'b' },
    });
    expectHeadersEqual({ a: 'b', c: 'd' });

    action1.prepare({ headers: new Headers({ c: 'd' }) }).execute({
        headers: { a: 'b' },
    });
    expectHeadersEqual({ a: 'b', c: 'd' });

    action1.prepare({ headers: new Headers({ c: 'd' }) }).execute({
        headers: [
            ['a', 'b'],
            ['e', 'f'],
        ],
    });
    expectHeadersEqual({ a: 'b', c: 'd', e: 'f' });

    action1
        .prepare({
            headers: [
                ['a', '1'],
                ['b', '2'],
            ],
        })
        .execute({
            headers: new Headers({
                // This will take precedence over config above
                b: '5',
                c: '10',
            }),
        });
    expectHeadersEqual({ a: '1', b: '5', c: '10' });

    const action2 = new Endpoint(new UrlPattern('/whatever/:id?/'), { headers: { a: 'one' } });
    action2.prepare({ headers: { b: 'two' } }).execute({
        headers: { c: 'three' },
    });
    expectHeadersEqual({ a: 'one', b: 'two', c: 'three' });

    action2.prepare({ headers: { b: 'two' } }).execute({
        headers: { b: undefined, c: 'three' },
    });
    expectHeadersEqual({ a: 'one', c: 'three' });

    Endpoint.defaultConfig.requestInit = {
        headers: {
            token: 'abc123',
            extra: '5',
        },
    };

    action2.prepare().execute({
        headers: { c: 'three' },
    });
    expectHeadersEqual({ a: 'one', c: 'three', token: 'abc123', extra: '5' });

    action2.execute({
        headers: { c: 'three', extra: undefined },
    });
    expectHeadersEqual({ a: 'one', c: 'three', token: 'abc123' });
});

test('should raise RequestError on bad request', async () => {
    fetchMock.mockResponseOnce(() => {
        throw new TypeError('Unknown error');
    });
    const action1 = new Endpoint(new UrlPattern('/whatever/'));
    let error;
    try {
        await action1.execute();
    } catch (err) {
        error = err;
    }
    expect(error).not.toBeFalsy();
    expect(error).toBeInstanceOf(RequestError);
    expect(error.message).toEqual('Unknown error');
});

test('should raise ApiError on non-2xx response', async () => {
    fetchMock.mockResponseOnce('', { status: 400, statusText: 'Bad Request' });
    const action1 = new Endpoint(new UrlPattern('/whatever/'));
    await expect(action1.execute()).rejects.toThrowError(new ApiError(400, 'Bad Request', ''));
    fetchMock.mockResponseOnce('', { status: 500, statusText: 'Server Error' });
    await expect(action1.execute()).rejects.toThrowError(new ApiError(500, 'Server Error', ''));

    fetchMock.mockResponseOnce(JSON.stringify({ name: 'This field is required' }), {
        headers: {
            'Content-Type': 'application/json',
        },
        status: 400,
        statusText: 'Bad Request',
    });
    let error;
    try {
        await action1.execute();
    } catch (err) {
        error = err;
    }
    expect(error).not.toBeFalsy();
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.statusText).toBe('Bad Request');
    expect(error.content).toEqual({ name: 'This field is required' });
});

test('should update paginator state on response', async () => {
    const action1 = new Endpoint(new UrlPattern('/whatever/'), {
        middleware: [paginationMiddleware()],
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    let { result: hookResult } = renderHook(() => useTestHook(action1.getPaginatorClass()));

    const records = Array.from({ length: 5 }, (_, i) => ({ id: i }));
    fetchMock.mockResponseOnce(JSON.stringify({ count: 10, results: records }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    await act(async () => {
        const { result } = await action1.execute({ paginator: hookResult.current });
        expect((hookResult.current as InferredPaginator).paginator).toBeInstanceOf(
            PageNumberPaginator
        );
        expect(
            ((hookResult.current as InferredPaginator).paginator as PageNumberPaginator).pageSize
        ).toBe(5);
        expect(result).toEqual(records);
    });

    // Should also work by passing paginator to prepare
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    hookResult = renderHook(() => useTestHook(action1.getPaginatorClass())).result;
    fetchMock.mockResponseOnce(
        JSON.stringify({
            count: 10,
            results: records,
            next: 'http://loclahost/whatever/?limit=5&offset=5',
        }),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
    const prepared = action1.prepare({ paginator: hookResult.current });

    await act(async () => {
        const { result: result2 } = await prepared.execute();

        expect((hookResult.current as InferredPaginator).paginator).toBeInstanceOf(
            LimitOffsetPaginator
        );
        expect(
            ((hookResult.current as InferredPaginator).paginator as LimitOffsetPaginator).limit
        ).toBe(5);
        expect(result2).toEqual(records);
    });
});

test('should support changing paginatorClass & getPaginationState', async () => {
    const getPaginationState = (paginator, execReturnVal): Record<string, any> => {
        const { total, records, pageSize } = execReturnVal.decodedBody;
        return {
            total,
            results: records,
            pageSize,
        };
    };
    const action1 = new Endpoint(new UrlPattern('/whatever/'), {
        middleware: [paginationMiddleware(PageNumberPaginator, getPaginationState)],
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const { result: hookResult } = renderHook(() => useTestHook(action1.getPaginatorClass()));

    const records = Array.from({ length: 5 }, (_, i) => ({ id: i }));
    fetchMock.mockResponseOnce(JSON.stringify({ total: 10, records, pageSize: 5 }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    await act(async () => {
        const { result } = await action1.execute({ paginator: hookResult.current });
        expect(hookResult.current).toBeInstanceOf(PageNumberPaginator);
        expect((hookResult.current as PageNumberPaginator).pageSize).toBe(5);
        expect(result).toEqual(records);
    });
});

test('should support custom URL resolve function', () => {
    fetchMock.mockResponse('');
    const endpoint = new Endpoint(new UrlPattern('/whatever/:id?/'), {
        resolveUrl(urlPattern, urlArgs, query): string {
            return urlPattern.resolve(urlArgs, { query: { ...query, always: 1 } });
        },
    });
    endpoint.prepare().execute();
    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual('/whatever/?always=1');
    endpoint.prepare({ urlArgs: { id: 2 } }).execute();
    expect(fetchMock.mock.calls.length).toEqual(2);
    expect(fetchMock.mock.calls[1][0]).toEqual('/whatever/2/?always=1');
    endpoint.prepare({ urlArgs: { id: 2 }, query: { a: 'b' } }).execute();
    expect(fetchMock.mock.calls.length).toEqual(3);
    expect(fetchMock.mock.calls[2][0]).toEqual('/whatever/2/?a=b&always=1');
    endpoint.prepare({ query: { a: 'b' } }).execute();
    expect(fetchMock.mock.calls.length).toEqual(4);
    expect(fetchMock.mock.calls[3][0]).toEqual('/whatever/?a=b&always=1');

    // Same thing but call execute directly without prepare
    fetchMock.resetMocks();
    endpoint.execute();
    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual('/whatever/?always=1');
    endpoint.execute({ urlArgs: { id: 2 } });
    expect(fetchMock.mock.calls.length).toEqual(2);
    expect(fetchMock.mock.calls[1][0]).toEqual('/whatever/2/?always=1');
    endpoint.execute({ urlArgs: { id: 2 }, query: { a: 'b' } });
    expect(fetchMock.mock.calls.length).toEqual(3);
    expect(fetchMock.mock.calls[2][0]).toEqual('/whatever/2/?a=b&always=1');
    endpoint.execute({ query: { a: 'b' } });
    expect(fetchMock.mock.calls.length).toEqual(4);
    expect(fetchMock.mock.calls[3][0]).toEqual('/whatever/?a=b&always=1');
});

test('should be possible to implement auth replay middleware', async () => {
    // This test simulates middleware that catches response failures
    // due to a 401 response (eg. users session has expired). It captures
    // this and returns a new promise that only resolves after successful
    // login occurs and original request is replayed.
    const emitter = {
        listeners: [],
        addListener(cb: () => void): void {
            this.listeners.push(cb);
        },
        resolve(): void {
            this.listeners.forEach(cb => cb());
        },
    };
    // For testing purposes we need to know when the first response has finished
    // Once this has resolved the original promise from `execute` will still be
    // pending.
    let resolveOuter;
    let outer = new Promise(resolve => {
        resolveOuter = resolve;
    });
    const middleware1Start = jest.fn();
    const middleware1End = jest.fn();
    const middleware3Start = jest.fn();
    const middleware3End = jest.fn();
    Endpoint.defaultConfig.middleware = [
        async (url, requestInit, next): Promise<any> => {
            middleware1Start();
            const r = await next(url, requestInit);
            middleware1End();
            return r;
        },
        async (url, requestInit, next, { execute }): Promise<any> => {
            try {
                return await next(url, requestInit);
            } catch (e) {
                resolveOuter();
                if (e.status === 401) {
                    return new Promise(resolve => {
                        emitter.addListener(async () => {
                            resolve(await execute());
                        });
                    });
                }
                throw e;
            }
        },
        async (url, requestInit, next): Promise<any> => {
            middleware3Start();
            let r;
            try {
                r = await next(url, requestInit);
            } catch (e) {
                middleware3End();
                throw e;
            }
            middleware3End();
            return r;
        },
    ];
    fetchMock.mockResponseOnce('', { status: 401 });
    const action1 = new Endpoint(new UrlPattern('/whatever/'));
    const p = action1.prepare().execute();
    await outer;
    expect(middleware1Start).toHaveBeenCalledTimes(1);
    expect(middleware1End).not.toHaveBeenCalled();
    expect(middleware3Start).toHaveBeenCalledTimes(1);
    expect(middleware3End).toHaveBeenCalledTimes(1);
    [middleware1Start, middleware1End, middleware3Start, middleware3End].forEach(fn =>
        fn.mockReset()
    );
    fetchMock.mockResponseOnce('hello world', {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
    // This triggers the refetch in the middleware
    emitter.resolve();
    // Finally the original promise should resolve to the final response
    expect((await p).result).toBe('hello world');
    expect(middleware1Start).toHaveBeenCalledTimes(1);
    // NOTE: middleware1End is called 2 times - chain gets unwound when Promise returned by
    // middleware 2 is finally resolved but it has since been called again due to the
    // context.execute() call. There's no way around that with this kind of middleware
    // design. So the flow is:
    //  middleware 1 - start
    //  middleware 2 - start
    //  middleware 3 - start
    //  middleware 3 - end (error)
    //  middleware 2 - end
    //  EXECUTE STARTS
    //  middleware 1 - start
    //  middleware 2 - start
    //  middleware 3 - start
    //  middleware 3 - end
    //  middleware 2 - end
    //  middleware 1 - end
    //  middleware 1 - end
    expect(middleware1End).toHaveBeenCalledTimes(2);
    expect(middleware3Start).toHaveBeenCalledTimes(1);
    expect(middleware3End).toHaveBeenCalledTimes(1);
});

test('middleware should be able to de-dupe requests', async () => {
    const requestsInFlight = {};
    const middleware = [
        async (url, requestInit, next): Promise<any> => {
            // For simplicity sake just cache by URL here - real implementation would consider headers, query string etc
            if (requestsInFlight[url]) {
                return requestsInFlight[url];
            } else {
                requestsInFlight[url] = next(url, requestInit);
                const promise = requestsInFlight[url];
                try {
                    const r = await promise;
                    delete requestsInFlight[url];
                    return r;
                } catch (err) {
                    delete requestsInFlight[url];
                    throw err;
                }
            }
        },
    ];
    fetchMock.mockResponse('hello world', {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
    const action1 = new Endpoint(new UrlPattern('/whatever/'), { middleware });
    const p1 = action1.prepare().execute();
    const p2 = action1.prepare().execute();
    expect((await p1).result).toBe('hello world');
    expect((await p2).result).toBe('hello world');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((await action1.prepare().execute()).result).toBe('hello world');
    expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('middleware should detect bad implementations', async () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function badMiddleware1(url, requestInit, next) {
        return next();
    }
    const action1 = new Endpoint(new UrlPattern('/whatever/'), { middleware: [badMiddleware1] });
    expect(action1.execute()).rejects.toThrowError(
        /Bad middleware implementation; invalid arguments/
    );

    fetchMock.mockResponse('hello world', {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function badMiddleware2(url, requestInit, next) {
        next(url, requestInit);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const action2 = new Endpoint(new UrlPattern('/whatever/'), { middleware: [badMiddleware2] });
    expect(action2.execute()).rejects.toThrowError(
        /Bad middleware implementation; function did not return anything/
    );
});

test('middleware header mutations should not mutate source objects', async () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function customHeaderMiddleware(url, requestInit, next) {
        requestInit.headers.set('X-ClientId', 'ABC123');
        return next(url, requestInit);
    }
    const action1 = new Endpoint(new UrlPattern('/whatever/'), {
        middleware: [customHeaderMiddleware],
    });
    fetchMock.mockResponse('hello world', {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
    const headers = new Headers({ 'x-csrf': '42' });
    await action1.execute({ headers });
    expect([...headers.keys()]).toEqual(['x-csrf']);
    const defaultHeaders = new Headers({ token: 'a' });
    Endpoint.defaultConfig.requestInit = {
        headers: defaultHeaders,
    };
    const action2 = new Endpoint(new UrlPattern('/whatever/'), {
        middleware: [customHeaderMiddleware],
    });
    await action2.execute({ headers });
    expect([...defaultHeaders.keys()]).toEqual(['token']);
});

test('middleware replays should not have mutations made in previous runs', async () => {
    let runCount = 0;
    let middlewareContext;
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async function customHeaderMiddleware(url, requestInit, next, context) {
        if (runCount === 0) {
            runCount += 1;
            // First run set a header and throw an error. When the call is replayed
            // the header should not exist
            requestInit.headers.set('X-ClientId', 'ABC123');
            middlewareContext = context;
            throw new Error('No good');
        }
        return next(url, requestInit);
    }
    const action1 = new Endpoint(new UrlPattern('/whatever/'), {
        middleware: [customHeaderMiddleware],
    });
    fetchMock.mockResponse(request => {
        return Promise.resolve({
            // Mocked call just returns the set header keys
            body: JSON.stringify([...request.headers.keys()]),
            init: {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
    });
    const headers = new Headers({ 'x-csrf': '42' });
    expect(action1.execute({ headers })).rejects.toThrowError(new Error('No good'));
    // context options shouldn't have been mutated by the middleware
    expect([...middlewareContext.executeOptions.headers.keys()]).toEqual(['x-csrf']);
    expect([...headers.keys()]).toEqual(['x-csrf']);
    // The header set in the original call to middleware shouldn't be here
    expect(await middlewareContext.execute()).toEqual(['x-csrf']);
});
