import deepEqual from 'lodash/isEqual';
import { act, render, renderHook, renderNoStrictMode } from 'presto-testing-library';
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
    expect(selector).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual([recordEqualTo(data1)]);
    unmount();
    Test1.cache.add({ ...data1, email: 'e@f.com' });
    expect(selector).toHaveBeenCalledTimes(2);
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
    const selector = cache => cache.getAll(['firstName', 'lastName', 'email']);

    let lastRenderData;
    let renderCount = 0;

    // Just using a wrapper component to render and then track last data + render count. I prefer this to rendering
    // the hook directly as it's more similar to how it would be used in a real app.
    function Wrapper() {
        lastRenderData = useViewModelCache(Test1, selector);
        renderCount += 1;

        return null;
    }

    // Render without strict mode so we don't get extra renders from react
    renderNoStrictMode(<Wrapper />);

    let calledCount = 1;
    expect(renderCount).toBe(calledCount);

    expect(lastRenderData).toEqual([recordEqualTo(data1)]);
    act(() => {
        Test1.cache.add(data2);
    });
    expect(lastRenderData).toEqual([recordEqualTo(data1), recordEqualTo(data2)]);
    expect(renderCount).toBe(++calledCount);

    act(() => {
        Test1.cache.add(data1);
        Test1.cache.add(data2);
    });

    // No changes, should not have been called again
    expect(renderCount).toBe(calledCount);

    const lastResult = lastRenderData;

    act(() => {
        Test1.cache.add({ id: 1, firstName: 'Bobby' });
    });

    // Should return same result as cached value is for subset of fields
    expect(renderCount).toBe(calledCount);
    expect(lastRenderData).toBe(lastResult);

    const data3 = { id: 1, firstName: 'Bobby', lastName: 'Jack', email: 'b@b.com' };
    act(() => {
        Test1.cache.add(data3);
    });
    expect(renderCount).toBe(++calledCount);
    expect(lastRenderData).toEqual([recordEqualTo(data3), recordEqualTo(data2)]);
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
    const last = result.current;
    expect(result.current).toEqual([recordEqualTo({ id: 1, email: 'a@b.com' })]);
    rerender({ fieldNames: ['email'] });
    expect(result.current).toBe(last);
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

test('should pick up changes from deleteAll', () => {
    const Test1 = createModel();
    // Cache by field individully, so there's no complete record
    Test1.cache.add([
        { id: 1, firstName: 'Bob' },
        { id: 2, firstName: 'Sam' },
        { id: 1, email: 'bob@example.com' },
        { id: 2, email: 'sam@example.com' },
    ]);

    function Comp({ fieldName }: { fieldName: 'email' | 'firstName' }): React.ReactElement {
        const records = useViewModelCache(Test1, cache => cache.getAll([fieldName]));

        return <div>{records.map(r => r[fieldName]).join(', ') || '<none>'}</div>;
    }

    expect(render(<Comp fieldName="firstName" />).container.textContent).toBe('Bob, Sam');

    expect(render(<Comp fieldName="email" />).container.textContent).toBe(
        'bob@example.com, sam@example.com'
    );
    act(() => {
        Test1.cache.deleteAll(['firstName']);
    });

    expect(render(<Comp fieldName="firstName" />).container.textContent).toBe('<none>');

    expect(render(<Comp fieldName="email" />).container.textContent).toBe(
        'bob@example.com, sam@example.com'
    );

    act(() => {
        Test1.cache.deleteAll();
    });

    expect(render(<Comp fieldName="email" />).container.textContent).toBe('<none>');
});
