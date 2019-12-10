import { UrlPattern } from '@xenopus/routing';
import { FetchMock } from 'jest-fetch-mock';
import Endpoint, { ApiError, RequestError } from '../Endpoint';

const fetchMock = fetch as FetchMock;

beforeEach(() => {
    fetchMock.resetMocks();
    Endpoint.defaultConfig.requestInit = {};
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

test('should support transformation function', async () => {
    fetchMock.mockResponseOnce('hello world', {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
    const action1 = new Endpoint(new UrlPattern('/whatever/'), {
        transformResponseBody: (data: Record<string, any>): Record<string, any> =>
            data.toUpperCase(),
    });
    expect(await action1.prepare().execute()).toBe('HELLO WORLD');
    const action2 = new Endpoint(new UrlPattern('/whatever/'), {
        transformResponseBody: (data: Record<string, any>): Record<string, any> =>
            Object.entries(data).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {}),
    });
    fetchMock.mockResponseOnce(JSON.stringify({ a: 'b', c: 'd' }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    expect(await action2.prepare().execute()).toEqual({ b: 'a', d: 'c' });
});

test('should support merging global headers with action specific headers', async () => {
    fetchMock.mockResponse('');
    const expectHeadersEqual = (headers2): void => {
        const headers1 = new Headers(
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
