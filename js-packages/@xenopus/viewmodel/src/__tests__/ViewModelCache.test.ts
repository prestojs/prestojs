import Field from '../fields/Field';
import { recordEqualTo } from '../../../../../js-testing/matchers';
import ViewModel from '../ViewModel';
import ViewModelCache from '../ViewModelCache';

function F<T>(name): Field<T> {
    return new Field({ name, label: name });
}

test('should cache records', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
        };
    }
    class Test2 extends ViewModel {
        static fields = {
            id: F('id'),
        };
    }

    const record1 = new Test1({ id: 5 });

    // Should always get independent caches
    expect(Test1.cache).not.toBe(Test2.cache);

    Test1.cache.add(record1);

    expect(Test1.cache.get(5, ['id'])).toBe(record1);

    expect(Test2.cache.cache).toEqual(new Map());
    expect(Test2.cache.get(5, ['id'])).toBe(null);
});

test('should support custom cache', () => {
    class MyInvalidCache {}
    expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestBad extends ViewModel {
            static cache = new MyInvalidCache();
        }
    }).toThrowError('cache class must extend ViewModelCache');

    class MyCache<T extends ViewModel> extends ViewModelCache<T> {}
    class Test1 extends ViewModel {
        static cache = new MyCache<Test1>();
    }

    expect(Test1.cache).toBeInstanceOf(MyCache);
});

test('updating a record should result in cache for subset of fields being updated', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }
    Test1.cache.add(new Test1({ id: 5, firstName: 'B' }));
    Test1.cache.add(new Test1({ id: 5, email: 'E' }));
    Test1.cache.add(new Test1({ id: 5, lastName: 'J' }));

    Test1.cache.add(new Test1({ id: 5, firstName: 'C', lastName: 'I' }));

    let firstName = Test1.cache.get(5, ['id', 'firstName']);
    expect(firstName).not.toBeNull();
    expect(firstName.toJS()).toEqual({ id: 5, firstName: 'C' });

    let lastName = Test1.cache.get(5, ['id', 'lastName']);
    expect(lastName).not.toBeNull();
    expect(lastName.toJS()).toEqual({ id: 5, lastName: 'I' });

    let firstLast = Test1.cache.get(5, ['id', 'firstName', 'lastName']);
    expect(firstLast).not.toBeNull();
    expect(firstLast.toJS()).toEqual({ id: 5, firstName: 'C', lastName: 'I' });

    Test1.cache.add(new Test1({ id: 5, firstName: 'D', email: '-' }));

    firstName = Test1.cache.get(5, ['id', 'firstName']);
    expect(firstName).not.toBeNull();
    expect(firstName.toJS()).toEqual({ id: 5, firstName: 'D' });

    let email = Test1.cache.get(5, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 5, email: '-' });

    let firstEmail = Test1.cache.get(5, ['id', 'firstName', 'email']);
    expect(firstEmail).not.toBeNull();
    expect(firstEmail.toJS()).toEqual({ id: 5, firstName: 'D', email: '-' });

    Test1.cache.add(new Test1({ id: 5, firstName: 'Bob', lastName: 'Jack', email: 'a@b.com' }));

    firstName = Test1.cache.get(5, ['id', 'firstName']);
    expect(firstName).not.toBeNull();
    expect(firstName.toJS()).toEqual({ id: 5, firstName: 'Bob' });

    lastName = Test1.cache.get(5, ['id', 'lastName']);
    expect(lastName).not.toBeNull();
    expect(lastName.toJS()).toEqual({ id: 5, lastName: 'Jack' });

    email = Test1.cache.get(5, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 5, email: 'a@b.com' });

    firstLast = Test1.cache.get(5, ['id', 'firstName', 'lastName']);
    expect(firstLast).not.toBeNull();
    expect(firstLast.toJS()).toEqual({ id: 5, firstName: 'Bob', lastName: 'Jack' });

    firstEmail = Test1.cache.get(5, ['id', 'firstName', 'email']);
    expect(firstEmail).not.toBeNull();
    expect(firstEmail.toJS()).toEqual({ id: 5, firstName: 'Bob', email: 'a@b.com' });
});

test('updating a record should result in cache for subset of fields being updated (even if not yet set)', () => {
    // This handles cases where you may try and access a cache for subset of fields that hasn't explicitly
    // been cached yet but is available as a superset of those fields. In those cases we expect the cache to
    // be populated lazily
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }

    const record1 = new Test1({ id: 5, firstName: 'Bob', lastName: 'Jack', email: 'a@b.com' });
    Test1.cache.add(record1);
    const firstName = Test1.cache.get(5, ['id', 'firstName']);
    expect(firstName).not.toBeNull();
    expect(firstName.toJS()).toEqual({ id: 5, firstName: 'Bob' });

    const lastName = Test1.cache.get(5, ['id', 'lastName']);
    expect(lastName).not.toBeNull();
    expect(lastName.toJS()).toEqual({ id: 5, lastName: 'Jack' });

    let email = Test1.cache.get(5, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 5, email: 'a@b.com' });

    const firstLast = Test1.cache.get(5, ['id', 'firstName', 'lastName']);
    expect(firstLast).not.toBeNull();
    expect(firstLast.toJS()).toEqual({ id: 5, firstName: 'Bob', lastName: 'Jack' });

    const firstEmail = Test1.cache.get(5, ['id', 'firstName', 'email']);
    expect(firstEmail).not.toBeNull();
    expect(firstEmail.toJS()).toEqual({ id: 5, firstName: 'Bob', email: 'a@b.com' });

    // Both these additions should alter the id + email cache - test we get the last result back
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 2, lastName: 'Jack', email: 'jack@b.com' }));
    email = Test1.cache.get(2, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 2, email: 'jack@b.com' });
});

test('should use most recently set superset of fields', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 2, lastName: 'Jack', email: 'jack@b.com' }));

    let email = Test1.cache.get(2, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 2, email: 'jack@b.com' });
    // Getting same record again should be the same object
    expect(email).toBe(Test1.cache.get(2, ['id', 'email']));

    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));

    email = Test1.cache.get(2, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 2, email: 'bob@b.com' });
});

test('should support removing records from cache', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 2, lastName: 'Jack', email: 'jack@b.com' }));
    Test1.cache.delete(2);

    expect(Test1.cache.get(2, ['id', 'email'])).toBeNull();
    expect(Test1.cache.get(2, ['id', 'firstName'])).toBeNull();
    expect(Test1.cache.get(2, ['id', 'lastName'])).toBeNull();
});

test('should support removing records from cache for only specified field names', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 2, lastName: 'Jack', email: 'jack@b.com' }));
    Test1.cache.delete(2, ['id', 'lastName', 'email']);

    expect(Test1.cache.get(2, ['id', 'lastName'])).toBeNull();

    const email = Test1.cache.get(2, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 2, email: 'bob@b.com' });
});

test('should support retrieving multiple records', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 3, lastName: 'Jack', email: 'jack@b.com' }));
    Test1.cache.add(new Test1({ id: 4, firstName: 'Sam', email: 'sam@b.com' }));

    expect(Test1.cache.getList([2, 3, 4], ['id', 'firstName', 'email'])).toEqual([
        recordEqualTo({ id: 2, firstName: 'Bob', email: 'bob@b.com' }),
        null,
        recordEqualTo({ id: 4, firstName: 'Sam', email: 'sam@b.com' }),
    ]);

    expect(Test1.cache.getList([2, 3, 4], ['id', 'email'])).toEqual([
        recordEqualTo({ id: 2, email: 'bob@b.com' }),
        recordEqualTo({ id: 3, email: 'jack@b.com' }),
        recordEqualTo({ id: 4, email: 'sam@b.com' }),
    ]);
});

test('should notify listeners on add, change, delete', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }
    const cb1 = jest.fn();
    Test1.cache.addListener(2, ['id', 'firstName'], cb1);
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    expect(cb1).toHaveBeenCalledWith(
        null,
        recordEqualTo({
            id: 2,
            firstName: 'Bob',
        })
    );
    cb1.mockReset();
    Test1.cache.add(new Test1({ id: 3, lastName: 'Jack', email: 'jack@b.com' }));
    expect(cb1).not.toHaveBeenCalled();
    Test1.cache.add(new Test1({ id: 4, firstName: 'Sam', email: 'sam@b.com' }));
    expect(cb1).not.toHaveBeenCalled();
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bobby', email: 'bob@b.com' }));
    expect(cb1).toHaveBeenCalledWith(
        recordEqualTo({
            id: 2,
            firstName: 'Bob',
        }),
        recordEqualTo({
            id: 2,
            firstName: 'Bobby',
        })
    );
    cb1.mockReset();
    Test1.cache.delete(2, ['id', 'firstName']);
    expect(cb1).toHaveBeenCalledWith(
        recordEqualTo({
            id: 2,
            firstName: 'Bobby',
        }),
        null
    );
    const cb2 = jest.fn();
    Test1.cache.addListener(12, ['id', 'email'], cb2);
    const cb3 = jest.fn();
    Test1.cache.addListener(12, ['id', 'firstName', 'email'], cb3);
    Test1.cache.add(new Test1({ id: 12, firstName: 'Samwise', email: 'samwise@b.com' }));

    // We don't care about the addition notifications
    cb2.mockReset();
    cb3.mockReset();

    Test1.cache.delete(12);
    expect(cb2).toHaveBeenCalledWith(
        recordEqualTo({
            id: 12,
            email: 'samwise@b.com',
        }),
        null
    );
    expect(cb3).toHaveBeenCalledWith(
        recordEqualTo({
            id: 12,
            firstName: 'Samwise',
            email: 'samwise@b.com',
        }),
        null
    );
});

test('should not notify if identical record added', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }

    const cb1 = jest.fn();
    Test1.cache.addListener(2, ['id', 'firstName', 'email'], cb1);
    const record1 = new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' });
    Test1.cache.add(record1);
    expect(cb1).toHaveBeenCalledWith(null, record1);
    cb1.mockReset();
    // Adding same record should be ignored
    Test1.cache.add(record1);
    expect(cb1).not.toHaveBeenCalled();
    // Adding same record even if strict equality fails should be ignored
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    expect(cb1).not.toHaveBeenCalled();
});

test('should support listening to multiple pks', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }
    const cb1 = jest.fn();
    const unsubscribe = Test1.cache.addListenerList([2, 3, 4], ['id', 'firstName', 'email'], cb1);
    const record1 = new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' });
    Test1.cache.add(record1);
    expect(cb1).toHaveBeenCalledWith([null, null, null], [record1, null, null]);
    const record2 = new Test1({ id: 3, firstName: 'Samwise', email: 'samwise@b.com' });
    Test1.cache.add(record2);
    expect(cb1).toHaveBeenCalledWith([record1, null, null], [record1, record2, null]);
    const record3 = new Test1({ id: 4, firstName: 'Gandalf', email: 'gandy@b.com' });
    Test1.cache.add(record3);
    expect(cb1).toHaveBeenCalledWith([record1, record2, null], [record1, record2, record3]);
    const record1Updated = new Test1({ id: 2, firstName: 'Bobby', email: 'bob@b.com' });
    Test1.cache.add(record1Updated);
    expect(cb1).toHaveBeenCalledWith(
        [record1, record2, record3],
        [record1Updated, record2, record3]
    );

    // Make sure unsubscribe works
    cb1.mockReset();
    unsubscribe();
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bobby', email: 'bobby@b.com' }));
    expect(cb1).not.toHaveBeenCalled();
});

test('should support listening to multiple pks, batch notifications', () => {
    class Test1 extends ViewModel {
        static fields = {
            id: F('id'),
            firstName: F('firstName'),
            lastName: F('lastName'),
            email: F('email'),
        };
    }

    const cb1 = jest.fn();
    const unsubscribe = Test1.cache.addListenerList([2, 3, 4], ['id', 'firstName', 'email'], cb1);
    const record1 = new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' });
    const record2 = new Test1({ id: 3, firstName: 'Samwise', email: 'samwise@b.com' });
    const record3 = new Test1({ id: 4, firstName: 'Gandalf', email: 'gandy@b.com' });
    Test1.cache.addList([record1, record2, record3]);
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb1).toHaveBeenCalledWith([null, null, null], [record1, record2, record3]);
});
