import deepEquals from 'lodash/isEqual';
import { renderHook } from 'presto-testing-library';
import useChangeObserver from '../useChangeObserver';

test('should handle scalar values', () => {
    const cb = jest.fn();
    function useTestEffect(value): void {
        useChangeObserver(value, cb);
    }
    const { rerender } = renderHook(
        ({ value }: { value: boolean | number | string }) => useTestEffect(value),
        {
            initialProps: { value: true },
        }
    );
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: false });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(true, false);
    rerender({ value: false });
    expect(cb).toHaveBeenCalledTimes(1);
    rerender({ value: true });
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith(false, true);
    rerender({ value: 0 });
    expect(cb).toHaveBeenCalledTimes(3);
    expect(cb).toHaveBeenLastCalledWith(true, 0);
    rerender({ value: 5 });
    expect(cb).toHaveBeenCalledTimes(4);
    expect(cb).toHaveBeenLastCalledWith(0, 5);
    rerender({ value: '5' });
    expect(cb).toHaveBeenCalledTimes(5);
    expect(cb).toHaveBeenLastCalledWith(5, '5');
    rerender({ value: '5' });
    expect(cb).toHaveBeenCalledTimes(5);
});

test('should support disabling callbacks', () => {
    const cb = jest.fn();
    function useTestEffect(value, disabled: boolean): void {
        useChangeObserver(value, cb, { disabled });
    }
    const { rerender } = renderHook(({ value, disabled }) => useTestEffect(value, disabled), {
        initialProps: { value: true, disabled: true },
    });
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: false, disabled: true });
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: true, disabled: false });
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: false, disabled: false });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(true, false);
    cb.mockReset();
    rerender({ value: true, disabled: true });
    expect(cb).not.toHaveBeenCalled();
});

test('should handle arrays', () => {
    const cb = jest.fn();
    function useTestEffect(value): void {
        useChangeObserver(value, cb);
    }
    const { rerender } = renderHook(({ value }: { value: string[] }) => useTestEffect(value), {
        initialProps: { value: [] },
    });
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: [] });
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: ['test'] });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith([], ['test']);
    rerender({ value: ['test'] });
    expect(cb).toHaveBeenCalledTimes(1);
    rerender({ value: ['test2'] });
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith(['test'], ['test2']);
    rerender({ value: ['test1', 'test2'] });
    expect(cb).toHaveBeenCalledTimes(3);
    expect(cb).toHaveBeenLastCalledWith(['test2'], ['test1', 'test2']);
    rerender({ value: ['test1', 'test2'] });
    expect(cb).toHaveBeenCalledTimes(3);
});

test('should handle objects shallow', () => {
    const cb = jest.fn();
    function useTestEffect(value): void {
        useChangeObserver(value, cb);
    }
    const { rerender } = renderHook(
        ({ value }: { value: Record<string, any> }) => useTestEffect(value),
        {
            initialProps: { value: {} },
        }
    );
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: {} });
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: { name: 'bob' } });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith({}, { name: 'bob' });
    rerender({ value: { name: 'bob' } });
    expect(cb).toHaveBeenCalledTimes(1);
    rerender({ value: { name: 'sam' } });
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith({ name: 'bob' }, { name: 'sam' });
    rerender({ value: { name: 'bob', age: 20 } });
    expect(cb).toHaveBeenCalledTimes(3);
    expect(cb).toHaveBeenLastCalledWith({ name: 'sam' }, { name: 'bob', age: 20 });
    rerender({ value: { name: 'bob', age: 20 } });
    expect(cb).toHaveBeenCalledTimes(3);

    // Nested objects will trigger change each time
    rerender({ value: { name: 'bob', age: 20, nested: {} } });
    expect(cb).toHaveBeenCalledTimes(4);
    rerender({ value: { name: 'bob', age: 20, nested: {} } });
    expect(cb).toHaveBeenCalledTimes(5);
    rerender({ value: { name: 'bob', age: 20, nested: {} } });
});

test('should handle custom equality check', () => {
    const cb = jest.fn();
    function useTestEffect(value, isEqual): void {
        useChangeObserver(value, cb, { isEqual });
    }
    const { rerender } = renderHook(
        ({
            value,
            isEqual,
        }: {
            value: Record<string, any>;
            isEqual?: (a: any, b: any) => boolean;
        }) => useTestEffect(value, isEqual),
        {
            initialProps: { value: { name: 'bob', age: 20, nested: {} } },
        }
    );
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: { name: 'bob', age: 20, nested: {} }, isEqual: deepEquals });
    expect(cb).not.toHaveBeenCalled();
    rerender({ value: { name: 'bob', age: 20, nested: { name: 'sam' } }, isEqual: deepEquals });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(
        { name: 'bob', age: 20, nested: {} },
        { name: 'bob', age: 20, nested: { name: 'sam' } }
    );
    rerender({ value: { name: 'bob', age: 20, nested: { name: 'sam' } }, isEqual: deepEquals });
    expect(cb).toHaveBeenCalledTimes(1);
    rerender({ value: { name: 'bob', age: 20, nested: { name: 'samwise' } }, isEqual: deepEquals });
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith(
        { name: 'bob', age: 20, nested: { name: 'sam' } },
        { name: 'bob', age: 20, nested: { name: 'samwise' } }
    );
});
