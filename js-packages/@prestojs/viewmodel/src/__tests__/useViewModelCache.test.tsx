import React from 'react';
import { render } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';

import { recordEqualTo } from '../../../../../js-testing/matchers';
import useViewModelCache from '../useViewModelCache';

import ViewModel from '../ViewModel';
import Field from '../fields/Field';
import ViewModelCache from '../ViewModelCache';

class Test1 extends ViewModel {
    static _fields = {
        id: new Field(),
        firstName: new Field(),
        lastName: new Field(),
        email: new Field(),
    };
}

beforeEach(() => {
    Test1.cache = new ViewModelCache<Test1>(Test1);
});

test('should select initial state', () => {
    const data1 = { id: 1, firstName: 'Bob', lastName: 'Jack', email: 'a@b.com' };
    Test1.cache.add(data1);
    const selector = jest.fn(cache => cache.getAll(['firstName', 'lastName', 'email']));

    const { result } = renderHook(() => useViewModelCache(Test1, selector));
    expect(result.current).toEqual([recordEqualTo(data1)]);
});

test('should unsubscribe on unmount', () => {
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
    const data1 = { id: 1, firstName: 'Bob', lastName: 'Jack', email: 'a@b.com' };
    const data2 = { id: 2, firstName: 'Sam', lastName: 'Jack', email: 'b@c.com' };
    Test1.cache.add(data1);
    const selector = jest.fn(cache => cache.getAll(['firstName', 'lastName', 'email']));

    const { result } = renderHook(() => useViewModelCache(Test1, selector));
    // It is called twice upfront: once as soon as the hook is called and once
    // as soon as the subscription is added in the layout effect
    expect(selector).toHaveBeenCalledTimes(2);

    expect(result.current).toEqual([recordEqualTo(data1)]);
    act(() => {
        Test1.cache.add(data2);
    });

    expect(result.current).toEqual([recordEqualTo(data1), recordEqualTo(data2)]);
    expect(selector).toHaveBeenCalledTimes(3);

    act(() => {
        Test1.cache.add(data1);
        Test1.cache.add(data2);
    });

    // No changes, should not have been called again
    expect(selector).toHaveBeenCalledTimes(3);

    const lastResult = result.current;

    act(() => {
        Test1.cache.add({ id: 1, firstName: 'Bobby' });
    });

    // Selector will have been called but should return same result as cached value
    // is for subset of fields
    expect(selector).toHaveBeenCalledTimes(4);
    expect(result.current).toBe(lastResult);

    const data3 = { id: 1, firstName: 'Bobby', lastName: 'Jack', email: 'b@b.com' };
    act(() => {
        Test1.cache.add(data3);
    });

    expect(selector).toHaveBeenCalledTimes(5);
    expect(result.current).toEqual([recordEqualTo(data3), recordEqualTo(data2)]);
});

test('should handle selector changes', () => {
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
