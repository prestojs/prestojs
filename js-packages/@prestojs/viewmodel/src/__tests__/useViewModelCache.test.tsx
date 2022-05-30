import deepEqual from 'lodash/isEqual';
import { act, render, renderHook } from 'presto-testing-library';
import React from 'react';

import { recordEqualTo } from '../../../../../js-testing/matchers';

import Field from '../fields/Field';
import useViewModelCache from '../useViewModelCache';
import ViewModelFactory from '../ViewModelFactory';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createModel = () =>
    ViewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    );

test('should select initial state', () => {
    const Test1 = createModel();
    const data1 = { id: 1, firstName: 'Bob', lastName: 'Jack', email: 'a@b.com' };
    Test1.cache.add(data1);
    const selector = jest.fn(cache => cache.getAll(['firstName', 'lastName', 'email']));

    const { result } = renderHook(() => useViewModelCache(Test1, selector));
    expect(result.current).toEqual([recordEqualTo(data1)]);
});

test('should unsubscribe on unmount', () => {
    const Test1 = createModel();
    const data1 = { id: 1, firstName: 'Bob', lastName: 'Jack', email: 'a@b.com' };
    Test1.cache.add(data1);
    const selector = jest.fn(cache => cache.getAll(['firstName', 'lastName', 'email']));

    const { result, unmount } = renderHook(() => useViewModelCache(Test1, selector));
    expect(selector).toHaveBeenCalledTimes(4);
    expect(result.current).toEqual([recordEqualTo(data1)]);
    unmount();
    Test1.cache.add({ ...data1, email: 'e@f.com' });
    expect(selector).toHaveBeenCalledTimes(4);
});

test('should handle updates between first render and subscription', () => {
    const Test1 = createModel();
    const data1 = { id: 1, firstName: 'Bob' };
    Test1.cache.add(data1);
    const selector = jest.fn(cache => cache.getAll(['firstName']));
    let count = 0;

    function Comp(): React.ReactElement {
        const records = useViewModelCache(Test1, selector);

        if (count === 0) {
            Test1.cache.add({ id: 2, firstName: 'Sam' });
        }
        count += 1;

        return records.map(r => r.firstName).join(', ');
    }

    const { container } = render(<Comp />);
    expect(container.textContent).toBe('Bob, Sam');
});

test('should rerender with new results on change', () => {
    const Test1 = createModel();
    const data1 = { id: 1, firstName: 'Bob', lastName: 'Jack', email: 'a@b.com' };
    const data2 = { id: 2, firstName: 'Sam', lastName: 'Jack', email: 'b@c.com' };
    Test1.cache.add(data1);
    const selector = jest.fn(cache => cache.getAll(['firstName', 'lastName', 'email']));

    const { result } = renderHook(() => useViewModelCache(Test1, selector));
    // It is called twice upfront: once as soon as the hook is called and once
    // as soon as the subscription is added in the layout effect. StrictMode causes
    // this to happen twice.
    let calledCount = 4;
    expect(selector).toHaveBeenCalledTimes(calledCount);

    expect(result.current).toEqual([recordEqualTo(data1)]);
    act(() => {
        Test1.cache.add(data2);
    });

    expect(result.current).toEqual([recordEqualTo(data1), recordEqualTo(data2)]);
    expect(selector).toHaveBeenCalledTimes(++calledCount);

    act(() => {
        Test1.cache.add(data1);
        Test1.cache.add(data2);
    });

    // No changes, should not have been called again
    expect(selector).toHaveBeenCalledTimes(calledCount);

    const lastResult = result.current;

    act(() => {
        Test1.cache.add({ id: 1, firstName: 'Bobby' });
    });

    // Selector will have been called but should return same result as cached value
    // is for subset of fields
    expect(selector).toHaveBeenCalledTimes(++calledCount);
    expect(result.current).toBe(lastResult);

    const data3 = { id: 1, firstName: 'Bobby', lastName: 'Jack', email: 'b@b.com' };
    act(() => {
        Test1.cache.add(data3);
    });

    expect(selector).toHaveBeenCalledTimes(++calledCount);
    expect(result.current).toEqual([recordEqualTo(data3), recordEqualTo(data2)]);
});

test('should handle selector changes', () => {
    const Test1 = createModel();
    const data1 = { id: 1, firstName: 'Bob', email: 'a@b.com' };
    Test1.cache.add(data1);
    const selector1 = jest.fn(cache => cache.getAll(['firstName']));
    const selector2 = jest.fn(cache => cache.getAll(['email']));

    const { result, rerender } = renderHook(({ selector }) => useViewModelCache(Test1, selector), {
        initialProps: { selector: selector1 },
    });
    expect(result.current).toEqual([recordEqualTo({ id: 1, firstName: 'Bob' })]);
    rerender({ selector: selector2 });

    expect(result.current).toEqual([recordEqualTo({ id: 1, email: 'a@b.com' })]);
});

test('should accept extra args', () => {
    const Test1 = createModel();
    const data1 = { id: 1, firstName: 'Bob', email: 'a@b.com' };
    Test1.cache.add(data1);
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const getAll = (cache, fieldNames) => cache.getAll(fieldNames);
    const selector = jest.fn(getAll);

    const { result, rerender } = renderHook(
        ({ fieldNames }) => useViewModelCache(Test1, selector, [fieldNames]),
        {
            initialProps: { fieldNames: ['firstName'] },
        }
    );
    expect(result.current).toEqual([recordEqualTo({ id: 1, firstName: 'Bob' })]);
    rerender({ fieldNames: ['email'] });

    expect(result.current).toEqual([recordEqualTo({ id: 1, email: 'a@b.com' })]);

    rerender({ fieldNames: ['firstName', 'email'] });
    expect(result.current).toEqual([recordEqualTo({ id: 1, firstName: 'Bob', email: 'a@b.com' })]);

    rerender({ fieldNames: ['email'] });
    expect(result.current).toEqual([recordEqualTo({ id: 1, email: 'a@b.com' })]);
});

test('should allow custom equality checks', () => {
    const Test1 = createModel();
    Test1.cache.add({ id: 1, firstName: 'Bob', email: 'a@b.com' });
    Test1.cache.add({ id: 2, firstName: 'Bob', email: 'anotherbob@b.com' });
    Test1.cache.add({ id: 3, firstName: 'Sam', email: 'sam@b.com' });
    const selector = jest.fn(cache =>
        cache.getAll(['firstName']).reduce((acc, record) => {
            acc[record.firstName] = acc[record.firstName] || [];
            acc[record.firstName].push(record.id);
            return acc;
        }, {})
    );

    const { result, rerender } = renderHook(() =>
        useViewModelCache(Test1, selector, [], deepEqual)
    );
    const last = result.current;
    expect(last).toEqual({ Bob: [1, 2], Sam: [3] });
    act(() => {
        // Add same value again to trigger listener to rerender
        Test1.cache.add({ id: 1, firstName: 'Bob', email: 'a@b.com' });
    });
    expect(result.current).toBe(last);
    rerender();
    expect(result.current).toBe(last);
    act(() => {
        Test1.cache.add({ id: 4, firstName: 'Bob', email: 'bob@b.com' });
    });
    expect(result.current).not.toBe(last);
    expect(result.current).toEqual({
        Bob: [1, 2, 4],
        Sam: [3],
    });
});
