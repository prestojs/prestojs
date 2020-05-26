import { isPromise } from '../misc';

test('isPromise should identify promises', () => {
    expect(isPromise(new Promise(() => undefined))).toBe(true);
    expect(isPromise({})).toBe(false);
    expect(isPromise(null)).toBe(false);
    expect(isPromise(5)).toBe(false);
});
