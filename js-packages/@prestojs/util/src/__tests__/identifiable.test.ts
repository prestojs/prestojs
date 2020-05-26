import { getId, hashId, isIdentifiable, isSameById } from '../identifiable';

test('isIdentifiable should work with id or _pk', () => {
    expect(isIdentifiable({})).toBe(false);
    expect(isIdentifiable(null)).toBe(false);
    expect(isIdentifiable(5)).toBe(false);
    expect(isIdentifiable({ _pk: 1 })).toBe(true);
    expect(isIdentifiable({ id: 1 })).toBe(true);
    expect(
        isIdentifiable({
            _pk: {
                k1: 1,
                k2: 2,
            },
        })
    ).toBe(true);
});

test('getId should return id', () => {
    expect(getId({ id: 1 })).toBe(1);
    expect(getId({ _pk: 1 })).toBe(1);
    // _pk takes precedence
    expect(getId({ _pk: 1, id: 2 })).toBe(1);
    expect(
        getId({
            _pk: {
                k1: 1,
                k2: 2,
            },
        })
    ).toEqual({
        k1: 1,
        k2: 2,
    });
});

test('getId should support fallback', () => {
    expect(() => getId({})).toThrow(/does not implement Identifiable/);
    expect(getId({ uuid: 5 }, item => item.uuid)).toBe(5);
    expect(getId({ id: 1, uuid: 5 }, item => item.uuid)).toBe(1);
});

test('isSameById should compare ids', () => {
    expect(isSameById({ id: 1 }, { id: 1 })).toBe(true);
    expect(isSameById({ id: 1 }, { _pk: 1 })).toBe(true);
    expect(isSameById({ id: 1 }, { _pk: 2 })).toBe(false);
    expect(isSameById({ id: 1 }, null)).toBe(false);
    expect(isSameById(null, { id: 1 })).toBe(false);
    expect(isSameById({ uuid: 1 }, { uuid: 1 }, item => item.uuid)).toBe(true);
    expect(isSameById({ uuid: 1 }, { uuid: 2 }, item => item.uuid)).toBe(false);
});

test('hashId should hash ids', () => {
    expect(hashId(1)).toBe('1');
    expect(
        hashId({
            k1: 1,
            k2: 2,
        })
    ).toBe(
        hashId({
            k2: 2,
            k1: 1,
        })
    );
});
