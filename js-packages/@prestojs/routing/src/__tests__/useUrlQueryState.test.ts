/* eslint-disable @typescript-eslint/camelcase */
import qs from 'qs';
import diff from 'jest-diff';
import { useState, useEffect } from 'react';
import { renderHook, act, RenderHookResult } from '@testing-library/react-hooks';
import useUrlQueryState from '../useUrlQueryState';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R, T> {
            queryStateEquals(hookStatus: any, msg?: string): R;
        }
    }
}

expect.extend({
    queryStateEquals(params, expected) {
        const received =
            typeof params == 'string'
                ? qs.parse(params, { ignoreQueryPrefix: true })
                : params.result.current[0];
        const pass = this.equals(received, expected);
        const message = pass
            ? (): string =>
                  this.utils.matcherHint('toBe', undefined, undefined) +
                  '\n\n' +
                  `Expected: ${this.utils.printExpected(expected)}\n` +
                  `Received: ${this.utils.printReceived(received)}`
            : (): string => {
                  const difference = diff(expected, received, {
                      expand: this.expand,
                  });
                  return (
                      this.utils.matcherHint('toBe', undefined, undefined) +
                      '\n\n' +
                      (difference && difference.includes('- Expect')
                          ? `Difference:\n\n${difference}`
                          : `Expected: ${this.utils.printExpected(expected)}\n` +
                            `Received: ${this.utils.printReceived(received)}`)
                  );
              };

        return { actual: received, message, pass };
    },
});

// Dummy navigation like object that handles URL changes, notifies listeners
const navigation = {
    search: '',
    pathname: '/',
    push(url: string): void {
        const [pathname, search] = url.split('?');
        Object.assign(this, { pathname, search });
        this.listeners.forEach(cb => cb());
    },
    listeners: [],
    listen(cb: () => void): () => void {
        this.listeners.push(cb);
        return (): void => {
            const index = this.listeners.indexOf(cb);
            if (index !== -1) {
                this.listeners.splice(index, 1);
            }
        };
    },
};
navigation.push = navigation.push.bind(navigation);

function useDummyNavigation(): {
    location: { search: string; pathname: string };
    replaceUrl: (url: string) => void;
} {
    const [, setState] = useState(false);
    useEffect(() => {
        return navigation.listen(() => setState(v => !v));
    });

    return { location: navigation, replaceUrl: navigation.push };
}

type ResultType = [
    Record<string, any>,
    (
        value: Record<string, any> | ((currentQuery: Record<string, any>) => Record<string, any>)
    ) => void
];

function useUrlQueryStateWrapper(initialState, options = {}): ResultType {
    const navigationProps = useDummyNavigation();
    return useUrlQueryState(initialState, { ...navigationProps, ...options });
}

function renderUrlQueryStateHook<P>(
    initialState,
    options = {}
): Omit<RenderHookResult<P, ResultType>, 'rerender'> & {
    rerender: (initialState: Record<string, any>, options?: {}) => void;
} {
    const { rerender, ...rest } = renderHook(
        ({ initialState, options }: { initialState: Record<string, any>; options: {} }) =>
            useUrlQueryStateWrapper(initialState, options),
        {
            initialProps: { initialState, options },
        }
    );

    return {
        ...rest,
        rerender(initialState: Record<string, any>, options: {} = {}): void {
            rerender({ initialState, options });
        },
    };
}

beforeEach(() => {
    Object.assign(navigation, {
        pathname: '/',
        search: '',
    });
});

test('useUrlQueryState should sync state with URL query params', () => {
    const hookStatus = renderUrlQueryStateHook({ q: '1' });
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    const { rerender } = hookStatus;
    expect(hookStatus).queryStateEquals({ q: '1' });
    act(() => setQueryState({ q: '2' }));
    expect(hookStatus).queryStateEquals({ q: '2' });

    act(() => setQueryState({ p: 'a' }));
    expect(hookStatus).queryStateEquals({ p: 'a' });

    // Re-rendering with different initial values shouldn't have any effect
    rerender({ test: 'one' });
    expect(hookStatus).queryStateEquals({ p: 'a' });
});

test('useUrlQueryState should support multiple hooks on same page', () => {
    const hook1 = renderUrlQueryStateHook({ a: 'one' }, { prefix: 'p1_' });
    const hook2 = renderUrlQueryStateHook({ z: 'ten' }, { prefix: 'p2_' });
    const expectHook1 = expect(hook1);
    const expectHook2 = expect(hook2);
    const setHook1QueryState = (nextState: {}): void => hook1.result.current[1](nextState);
    const setHook2QueryState = (nextState: {}): void => hook2.result.current[1](nextState);
    expect(navigation.search).queryStateEquals({ p1_a: 'one', p2_z: 'ten' });
    expectHook1.queryStateEquals({ a: 'one' });
    expectHook2.queryStateEquals({ z: 'ten' });
    act(() => setHook1QueryState({ a: 'two' }));
    expectHook1.queryStateEquals({ a: 'two' });
    expectHook2.queryStateEquals({ z: 'ten' });
    expect(navigation.search).queryStateEquals({ p1_a: 'two', p2_z: 'ten' });
    act(() => setHook2QueryState({ a: 'five', y: 'ten', z: 'eleven' }));
    expectHook1.queryStateEquals({ a: 'two' });
    expectHook2.queryStateEquals({ a: 'five', y: 'ten', z: 'eleven' });
    expect(navigation.search).queryStateEquals({
        p1_a: 'two',
        p2_a: 'five',
        p2_y: 'ten',
        p2_z: 'eleven',
    });
    act(() => navigation.push('/?p1_a=three&p2_y=ten&p2_another=test'));
    expect(navigation.search).queryStateEquals({ p1_a: 'three', p2_y: 'ten', p2_another: 'test' });
    expectHook1.queryStateEquals({ a: 'three' });
    expectHook2.queryStateEquals({ y: 'ten', another: 'test' });
});

test('useUrlQueryState should support controlledKeys option', () => {
    const hook1 = renderUrlQueryStateHook({ a: 'one' }, { controlledKeys: ['a'] });
    const hook2 = renderUrlQueryStateHook({ z: 'ten' }, { controlledKeys: ['y', 'z', 'another'] });
    const expectHook1 = expect(hook1);
    const expectHook2 = expect(hook2);
    const setHook1QueryState = (nextState: {}): void => hook1.result.current[1](nextState);
    const setHook2QueryState = (nextState: {}): void => hook2.result.current[1](nextState);
    expect(navigation.search).queryStateEquals({ a: 'one', z: 'ten' });
    expectHook1.queryStateEquals({ a: 'one' });
    expectHook2.queryStateEquals({ z: 'ten' });
    act(() => setHook1QueryState({ a: 'two' }));
    expectHook1.queryStateEquals({ a: 'two' });
    expectHook2.queryStateEquals({ z: 'ten' });
    expect(navigation.search).queryStateEquals({ a: 'two', z: 'ten' });
    act(() => setHook2QueryState({ y: 'ten', z: 'eleven' }));
    expectHook1.queryStateEquals({ a: 'two' });
    expectHook2.queryStateEquals({ y: 'ten', z: 'eleven' });
    expect(navigation.search).queryStateEquals({ a: 'two', y: 'ten', z: 'eleven' });
    act(() => navigation.push('/?a=three&y=ten&another=test'));
    expect(navigation.search).queryStateEquals({ a: 'three', y: 'ten', another: 'test' });
    expectHook1.queryStateEquals({ a: 'three' });
    expectHook2.queryStateEquals({ y: 'ten', another: 'test' });
});

test('useUrlQueryState controlledKeys option should respect initial entries', () => {
    navigation.pathname = '/test/';
    navigation.search = '?a=1&b=2&c=3&p_a=one';
    const hookStatus = renderUrlQueryStateHook({ z: 'one' }, { controlledKeys: ['a', 'z'] });
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    expect(hookStatus).queryStateEquals({ a: '1', z: 'one' });
    expect(navigation.search).queryStateEquals({ a: '1', b: '2', c: '3', p_a: 'one', z: 'one' });
    act(() => setQueryState({ a: '2' }));
    expect(hookStatus).queryStateEquals({ a: '2' });
    expect(navigation.search).queryStateEquals({ a: '2', b: '2', c: '3', p_a: 'one' });
});

test('useUrlQueryState controlledKeys option should warn for invalid keys', () => {
    const warnSpy = jest.fn();
    global.console.warn = warnSpy;
    navigation.pathname = '/test/';
    navigation.search = '?a=1&b=2&c=3&p_a=one';
    const hookStatus = renderUrlQueryStateHook(
        { z: 'one', t: 'two' },
        { controlledKeys: ['a', 'z'] }
    );
    expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('you passed keys to initialState')
    );
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    expect(hookStatus).queryStateEquals({ a: '1', z: 'one' });
    expect(navigation.search).queryStateEquals({ a: '1', b: '2', c: '3', p_a: 'one', z: 'one' });
    act(() => setQueryState({ a: '2', y: 2 }));
    expect(hookStatus).queryStateEquals({ a: '2' });
    expect(navigation.search).queryStateEquals({ a: '2', b: '2', c: '3', p_a: 'one' });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('you passed keys to setUrlState'));
});

test('useUrlQueryState should stringify all values', () => {
    const hookStatus = renderUrlQueryStateHook({ q: 1 });
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    expect(hookStatus).queryStateEquals({ q: '1' });
    expect(navigation.search).queryStateEquals({ q: '1' });
    act(() => setQueryState({ q: 2 }));
    expect(hookStatus).queryStateEquals({ q: '2' });
    expect(navigation.search).queryStateEquals({ q: '2' });
});

test('useUrlQueryState should set initialValues if not already set', () => {
    navigation.pathname = '/test/';
    navigation.search = '?a=1&b=2&c=3';
    const hookStatus = renderUrlQueryStateHook({ c: 'ok', d: 5 });
    expect(hookStatus).queryStateEquals({ a: '1', b: '2', c: '3', d: '5' });
});

test('useUrlQueryState should retain null values', () => {
    const hookStatus = renderUrlQueryStateHook({ q: '1' });
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    expect(hookStatus).queryStateEquals({ q: '1' });
    act(() => setQueryState({ q: null }));
    expect(hookStatus).queryStateEquals({ q: '' });
});

test('useUrlQueryState should support prefixed keys', () => {
    navigation.pathname = '/test/';
    navigation.search = '?a=1&b=2&c=3&p_a=one';
    const hookStatus = renderUrlQueryStateHook({ b: 'two' }, { prefix: 'p_' });
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    expect(hookStatus).queryStateEquals({ a: 'one', b: 'two' });
    expect(navigation.search).queryStateEquals({ a: '1', b: '2', c: '3', p_a: 'one', p_b: 'two' });
    act(() => setQueryState({ a: 'two', b: 'three' }));
    expect(hookStatus).queryStateEquals({ a: 'two', b: 'three' });
    expect(navigation.search).queryStateEquals({
        a: '1',
        b: '2',
        c: '3',
        p_a: 'two',
        p_b: 'three',
    });
    act(() => setQueryState({ b: 'bee', c: 'see' }));
    expect(hookStatus).queryStateEquals({ b: 'bee', c: 'see' });
    expect(navigation.search).queryStateEquals({ a: '1', b: '2', c: '3', p_b: 'bee', p_c: 'see' });
    act(() => setQueryState({}));
    expect(hookStatus).queryStateEquals({});
    expect(navigation.search).queryStateEquals({ a: '1', b: '2', c: '3' });
    act(() => setQueryState({}));
    expect(hookStatus).queryStateEquals({});
    expect(navigation.search).queryStateEquals({ a: '1', b: '2', c: '3' });
    act(() => navigation.push('/?a=1'));
    expect(hookStatus).queryStateEquals({});
    expect(navigation.search).queryStateEquals({ a: '1' });
    act(() => navigation.push('/?a=1&p_a=one'));
    expect(hookStatus).queryStateEquals({ a: 'one' });
    expect(navigation.search).queryStateEquals({ a: '1', p_a: 'one' });
    act(() => navigation.push('/?a=1&p_a=two'));
    expect(hookStatus).queryStateEquals({ a: 'two' });
    expect(navigation.search).queryStateEquals({ a: '1', p_a: 'two' });
});

test('useUrlQueryState should support changing prefix', () => {
    navigation.pathname = '/test/';
    navigation.search = '?a=1&b=2&c=3&p_a=one';
    const hookStatus = renderUrlQueryStateHook({ b: 'two' }, { prefix: 'p_' });
    expect(hookStatus).queryStateEquals({ a: 'one', b: 'two' });
    expect(navigation.search).queryStateEquals({ a: '1', b: '2', c: '3', p_a: 'one', p_b: 'two' });
    hookStatus.rerender({}, { prefix: 'c_' });
    expect(hookStatus).queryStateEquals({ a: 'one', b: 'two' });
    expect(navigation.search).queryStateEquals({ a: '1', b: '2', c: '3', c_a: 'one', c_b: 'two' });
});

test('useUrlQueryState should support custom parse rules', () => {
    navigation.pathname = '/test/';
    navigation.search = '?a=1';
    const hookStatus = renderUrlQueryStateHook({ q: '1' }, { parse: value => Number(value) });
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    expect(hookStatus).queryStateEquals({ a: 1, q: 1 });
    act(() => setQueryState({ a: 0, q: 2 }));
    expect(hookStatus).queryStateEquals({ a: 0, q: 2 });
    act(() => setQueryState({ q: '3' }));
    expect(hookStatus).queryStateEquals({ q: 3 });
    act(() => navigation.push('/?a=5&b=2'));
    expect(hookStatus).queryStateEquals({ a: 5, b: 2 });
});

test('useUrlQueryState should support custom stringify rules', () => {
    navigation.pathname = '/test/';
    navigation.search = '?a={}';
    const hookStatus = renderUrlQueryStateHook(
        { q: { test: 1 } },
        {
            parse: value => JSON.parse(value),
            stringify: value => JSON.stringify(value),
        }
    );
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    expect(hookStatus).queryStateEquals({ a: {}, q: { test: 1 } });
    act(() => setQueryState({ a: { ok: 'yes' }, q: { test: [1] } }));
    expect(hookStatus).queryStateEquals({ a: { ok: 'yes' }, q: { test: [1] } });
    act(() => setQueryState({ q: [] }));
    expect(hookStatus).queryStateEquals({ q: [] });
    act(() => navigation.push('/?a=[1,2,3]'));
    expect(hookStatus).queryStateEquals({ a: [1, 2, 3] });
});

test('useUrlQueryState should memoize return value', () => {
    const hookStatus = renderUrlQueryStateHook({ q: '1' });
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    const { rerender } = hookStatus;
    expect(hookStatus).queryStateEquals({ q: '1' });
    expect(navigation.search).queryStateEquals({ q: '1' });
    const prevValue = hookStatus.result.current;
    // Just re-rendering shouldn't change returned values
    rerender({ test: 'one' });
    expect(hookStatus.result.current[0]).toBe(prevValue[0]);
    expect(hookStatus.result.current[1]).toBe(prevValue[1]);
    // Same value shouldn't change anything
    act(() => setQueryState({ q: '1' }));
    expect(hookStatus.result.current[0]).toBe(prevValue[0]);
    expect(hookStatus.result.current[1]).toBe(prevValue[1]);
    // Different value should change
    act(() => setQueryState({ q: '2' }));
    expect(hookStatus.result.current[0]).not.toBe(prevValue[0]);
    expect(hookStatus.result.current[1]).not.toBe(prevValue[1]);
});

test('useUrlQueryState should not do unnecessary URL changes', () => {
    renderUrlQueryStateHook({ a: '1' });
    const listenMock = jest.fn();
    navigation.listen(listenMock);
    renderUrlQueryStateHook({ a: '1' });
    expect(listenMock).not.toHaveBeenCalled();
    renderUrlQueryStateHook({ a: '1', b: '2' });
    expect(listenMock).toHaveBeenCalled();
    listenMock.mockReset();
    const hookStatus = renderUrlQueryStateHook({ a: '1', b: '2' });
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    expect(listenMock).not.toHaveBeenCalled();
    act(() => setQueryState({ a: '1', b: '2' }));
    expect(listenMock).not.toHaveBeenCalled();
    act(() => setQueryState({ a: '1', b: '3' }));
    expect(listenMock).toHaveBeenCalled();
});

test('useUrlQueryState should accept function for setState', () => {
    const hookStatus = renderUrlQueryStateHook({ q: 1 }, { prefix: 'p_' });
    const setQueryState = (nextState: {}): void => hookStatus.result.current[1](nextState);
    expect(hookStatus).queryStateEquals({ q: '1' });
    expect(navigation.search).queryStateEquals({ p_q: '1' });
    act(() => setQueryState(state => ({ ...state, p: '0' })));
    expect(hookStatus).queryStateEquals({ q: '1', p: '0' });
    expect(navigation.search).queryStateEquals({ p_q: '1', p_p: '0' });
});
