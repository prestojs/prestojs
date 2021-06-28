import { UrlPattern } from '@prestojs/routing';
import { FetchMock } from 'jest-fetch-mock';
import batchMiddleware from '../batchMiddleware';
import Endpoint, { ApiError, mergeRequestInit } from '../Endpoint';

const fetchMock = fetch as FetchMock;

beforeEach(() => {
    fetchMock.resetMocks();
    Endpoint.defaultConfig.requestInit = {};
});

test('should batch requests', async () => {
    const records = {
        1: { name: 'One' },
        2: { name: 'Two' },
        3: { name: 'Three' },
    };
    const endpoint = new Endpoint(new UrlPattern('/whatever/'), {
        method: 'POST',
        middleware: [
            batchMiddleware<Record<string, string>, string>({
                execute(calls) {
                    // All the endpoints are the same URL so we can use the first
                    const { resolvedUrl } = calls[0];
                    // Extract the requested 'id' from each call
                    const ids = calls.map(call => {
                        return JSON.parse(call.requestInit.body as string).id;
                    });
                    // Call fetch, merge all other fetch options (headers etc) and create a
                    // new body with all the extracted ids.
                    return fetch(resolvedUrl, {
                        ...mergeRequestInit(...calls.map(call => call.requestInit)),
                        body: JSON.stringify({ ids }),
                    });
                },
                resolve(call, { result }) {
                    // For each call to the endpoint extract only the record it specifically request
                    return result[JSON.parse(call.requestInit.body as string).id];
                },
            }),
        ],
    });
    fetchMock.mockResponse(request => {
        const data = JSON.parse(((request.body as unknown) as Buffer).toString());
        return Promise.resolve({
            body: JSON.stringify(
                data.ids.reduce((acc, id) => {
                    acc[id] = records[id];
                    return acc;
                }, {})
            ),
            init: {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
    });
    const first = endpoint.execute({ body: JSON.stringify({ id: 1 }) });
    const second = endpoint.execute({ body: JSON.stringify({ id: 2 }) });
    expect((await first).result).toEqual(records[1]);
    expect((await second).result).toEqual(records[2]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('should respect batch key', async () => {
    const records = {
        1: { name: 'One' },
        2: { name: 'Two' },
        3: { name: 'Three' },
    };
    const endpoint = new Endpoint(new UrlPattern('/whatever/'), {
        method: 'POST',
        middleware: [
            batchMiddleware<Record<string, string>, string>({
                getBatchKey(call) {
                    return JSON.parse(call.requestInit.body as string).id < 3 ? 'batch1' : 'batch2';
                },
                execute(calls) {
                    // All the endpoints are the same URL so we can use the first
                    const { resolvedUrl } = calls[0];
                    // Extract the requested 'id' from each call
                    const ids = calls.map(call => {
                        return JSON.parse(call.requestInit.body as string).id;
                    });
                    // Call fetch, merge all other fetch options (headers etc) and create a
                    // new body with all the extracted ids.
                    return fetch(resolvedUrl, {
                        ...mergeRequestInit(...calls.map(call => call.requestInit)),
                        body: JSON.stringify({ ids }),
                    });
                },
                resolve(call, { result }) {
                    // For each call to the endpoint extract only the record it specifically request
                    return result[JSON.parse(call.requestInit.body as string).id];
                },
            }),
        ],
    });
    fetchMock.mockResponse(request => {
        const data = JSON.parse(((request.body as unknown) as Buffer).toString());
        return Promise.resolve({
            body: JSON.stringify(
                data.ids.reduce((acc, id) => {
                    acc[id] = records[id];
                    return acc;
                }, {})
            ),
            init: {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
    });
    const first = endpoint.execute({ body: JSON.stringify({ id: 1 }) });
    const second = endpoint.execute({ body: JSON.stringify({ id: 2 }) });
    const third = endpoint.execute({ body: JSON.stringify({ id: 3 }) });
    expect((await first).result).toEqual(records[1]);
    expect((await second).result).toEqual(records[2]);
    expect((await third).result).toEqual(records[3]);
    expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        '/whatever/',
        expect.objectContaining({ body: JSON.stringify({ ids: [1, 2] }) })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        '/whatever/',
        expect.objectContaining({ body: JSON.stringify({ ids: [3] }) })
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('should support reject', async () => {
    const endpoint = new Endpoint(new UrlPattern('/whatever/'), {
        method: 'POST',
        middleware: [
            batchMiddleware<Record<string, string>, string>({
                execute(calls) {
                    // All the endpoints are the same URL so we can use the first
                    const { resolvedUrl } = calls[0];
                    // Extract the requested 'id' from each call
                    const ids = calls.map(call => {
                        return JSON.parse(call.requestInit.body as string).id;
                    });
                    // Call fetch, merge all other fetch options (headers etc) and create a
                    // new body with all the extracted ids.
                    return fetch(resolvedUrl, {
                        ...mergeRequestInit(...calls.map(call => call.requestInit)),
                        body: JSON.stringify({ ids }),
                    });
                },
                reject(call, error) {
                    const { id } = JSON.parse(call.requestInit.body as string);
                    throw new ApiError(400, `Cannot get ${id}`, error.content);
                },
                resolve(call, { result }) {
                    return result[JSON.parse(call.requestInit.body as string).id];
                },
            }),
        ],
    });
    fetchMock.mockResponse(request => {
        return Promise.resolve({
            body: JSON.stringify({ error: 'Bad request' }),
            init: {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
    });
    const first = endpoint.execute({ body: JSON.stringify({ id: 1 }) });
    const second = endpoint.execute({ body: JSON.stringify({ id: 2 }) });
    await expect(first).rejects.toThrowError(
        new ApiError(400, 'Cannot get 1', { error: 'Bad request' })
    );
    await expect(second).rejects.toThrowError(
        new ApiError(400, 'Cannot get 2', { error: 'Bad request' })
    );
});

test('should support decodeBody', async () => {
    const records = {
        1: { name: 'One' },
        2: { name: 'Two' },
        3: { name: 'Three' },
    };
    const endpoint = new Endpoint<{ name: string }>(new UrlPattern('/whatever/'), {
        method: 'POST',
        middleware: [
            batchMiddleware<Record<string, { name: string }>, { name: string }>({
                execute(calls) {
                    // All the endpoints are the same URL so we can use the first
                    const { resolvedUrl } = calls[0];
                    // Extract the requested 'id' from each call
                    const ids = calls.map(call => {
                        return JSON.parse(call.requestInit.body as string).id;
                    });
                    // Call fetch, merge all other fetch options (headers etc) and create a
                    // new body with all the extracted ids.
                    return fetch(resolvedUrl, {
                        ...mergeRequestInit(...calls.map(call => call.requestInit)),
                        body: JSON.stringify({ ids }),
                    });
                },
                resolve(call, { result }) {
                    // For each call to the endpoint extract only the record it specifically request
                    return result[JSON.parse(call.requestInit.body as string).id];
                },
                async decodeBody(response) {
                    return Object.entries(
                        (await response.json()) as Record<string, { name: string }>
                    ).reduce((acc, [id, entry]) => {
                        acc[id] = { name: entry.name.toUpperCase() };
                        return acc;
                    }, {});
                },
            }),
        ],
    });
    fetchMock.mockResponse(request => {
        const data = JSON.parse(((request.body as unknown) as Buffer).toString());
        return Promise.resolve({
            body: JSON.stringify(
                data.ids.reduce((acc, id) => {
                    acc[id] = records[id];
                    return acc;
                }, {})
            ),
            init: {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
    });
    const first = endpoint.execute({ body: JSON.stringify({ id: 1 }) });
    const second = endpoint.execute({ body: JSON.stringify({ id: 2 }) });
    expect((await first).result.name).toEqual(records[1].name.toUpperCase());
    expect((await second).result.name).toEqual(records[2].name.toUpperCase());
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('should allow multiple batchMiddleware', async () => {
    let middleware1Count = 1;
    let middleware2Count = 1;
    const middleware = [
        batchMiddleware<Record<string, string>, string>({
            getBatchKey(call) {
                return call.resolvedUrl === '/url1/' ? '/url1/' : false;
            },
            execute(calls, batchKey) {
                return fetch(batchKey);
            },
            resolve(call, { result }, batchKey) {
                return `/url1/ ${middleware1Count++}`;
            },
        }),
        batchMiddleware<Record<string, string>, string>({
            getBatchKey(call) {
                return call.resolvedUrl === '/url2/' ? '/url2/' : false;
            },
            execute(calls, batchKey) {
                return fetch(batchKey);
            },
            resolve(call, { result }) {
                return `/url2/ ${middleware2Count++}`;
            },
        }),
    ];
    const endpoint1 = new Endpoint(new UrlPattern('/url1/'), {
        method: 'POST',
        middleware,
    });
    const endpoint2 = new Endpoint(new UrlPattern('/url2/'), {
        method: 'POST',
        middleware,
    });
    fetchMock.mockResponse('');
    const first = [endpoint1.execute(), endpoint1.execute()];
    const second = [endpoint2.execute(), endpoint2.execute()];
    expect((await Promise.all(first)).map(r => r.result)).toEqual(['/url1/ 1', '/url1/ 2']);
    expect((await Promise.all(second)).map(r => r.result)).toEqual(['/url2/ 1', '/url2/ 2']);
});

test('should enforce batchMiddleware in final position(s)', () => {
    expect(() => {
        new Endpoint(new UrlPattern('/whatever/'), {
            method: 'POST',
            middleware: [
                batchMiddleware<Record<string, string>, string>({
                    execute(calls) {
                        return fetch('');
                    },
                    resolve(call, { result }) {
                        return '';
                    },
                }),
                // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                (next, urlConfig, requestInit) => {
                    return next(urlConfig, requestInit);
                },
            ],
        });
    }).toThrowError('batchMiddleware must appear last in the middleware chain');
});
