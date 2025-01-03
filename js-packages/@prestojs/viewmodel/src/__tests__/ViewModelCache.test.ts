import process from 'process';
import { recordEqualTo } from '../../../../../js-testing/matchers';
import Field from '../fields/Field';
import IntegerField from '../fields/IntegerField';
import ListField from '../fields/ListField';
import { ManyRelatedViewModelField, RelatedViewModelField } from '../fields/RelatedViewModelField';
import ViewModelCache from '../ViewModelCache';
import viewModelFactory, {
    FieldPath,
    isViewModelInstance,
    ViewModelConstructor,
} from '../ViewModelFactory';

test('should cache records from record instance', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {
        static cache: ViewModelCache<typeof Test1> = new ViewModelCache(Test1);
    }
    class Test2 extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {
        static cache: ViewModelCache<typeof Test2> = new ViewModelCache(Test2);
    }

    const record1 = new Test1({ id: 5 });
    // Should always get independent caches
    expect(Test1.cache).not.toBe(Test2.cache);

    expect(Test1.cache.add(record1)).toBe(record1);

    expect(Test1.cache.get(5, ['id'])).toBe(record1);
    expect(Test1.cache.get(record1)).toBe(record1);

    expect(Test2.cache.get(5, ['id'])).toBe(null);
});

test('should handle id of 0', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {
        static cache: ViewModelCache<typeof Test1> = new ViewModelCache(Test1);
    }

    const record1 = new Test1({ id: 0 });
    expect(Test1.cache.add(record1)).toBe(record1);
    expect(Test1.cache.get(0, ['id'])).toBe(record1);
    expect(Test1.cache.get(record1)).toBe(record1);
});

test('should cache records from plain object', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    class Test2 extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1Data = { id: 5 };

    const record1 = Test1.cache.add(record1Data);

    expect(record1).toBeInstanceOf(Test1);
    expect(isViewModelInstance(record1) ? record1.toJS() : false).toEqual(record1Data);

    expect(Test1.cache.get(5, ['id'])).toBe(record1);

    expect(Test2.cache.get(5, ['id'])).toBe(null);
});

test('should throw error if caching different ViewModel', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    class Test2 extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1 = new Test1({ id: 5 });
    const record2 = new Test2({ id: 5 });

    expect(Test1.cache.add(record1)).toBe(record1);
    expect(() => Test1.cache.add(record2)).toThrow(
        /Attempted to cache ViewModel of type Test2 in cache for Test1/
    );
});

test('should cache records with compound keys', () => {
    class Test1 extends viewModelFactory(
        {
            id1: new Field(),
            id2: new Field(),
            name: new Field(),
        },
        { pkFieldName: ['id1', 'id2'] }
    ) {}

    const record1 = new Test1({ id1: 5, id2: 6, name: 'one' });

    Test1.cache.add(record1);

    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['id1', 'id2', 'name'])).toBe(record1);
    // Order of keys shouldn't matter
    expect(Test1.cache.get({ id2: 6, id1: 5 }, ['id1', 'id2', 'name'])).toBe(record1);

    // Adding with keys in different order shouldn't matter
    const record2 = new Test1({ id2: 6, id1: 5, name: 'two' });
    Test1.cache.add(record2);
    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['id1', 'id2', 'name'])).toBe(record2);
    expect(Test1.cache.get({ id2: 6, id1: 5 }, ['id1', 'id2', 'name'])).toBe(record2);

    const record3 = new Test1({ id1: 4, id2: 4, name: 'one' });

    Test1.cache.add(record3);

    expect(Test1.cache.get({ id1: 4, id2: 4 }, ['id1', 'id2', 'name'])).toBe(record3);
    // Order of keys shouldn't matter
    expect(Test1.cache.get({ id2: 4, id1: 4 }, ['id1', 'id2', 'name'])).toBe(record3);

    // Adding with keys in different order shouldn't matter
    const record4 = new Test1({ id2: 4, id1: 4, name: 'two' });
    Test1.cache.add(record4);
    expect(Test1.cache.get({ id1: 4, id2: 4 }, ['id1', 'id2', 'name'])).toBe(record4);
    expect(Test1.cache.get({ id2: 4, id1: 4 }, ['id1', 'id2', 'name'])).toBe(record4);
});

test('should validate pk(s)', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    const record1 = new Test1({ id: 5 });

    Test1.cache.add(record1);
    expect(() => Test1.cache.get({}, ['id'])).toThrow(
        "Test1 has a single primary key named 'id' but an object was provided. This should be a number or string."
    );

    class Test2 extends viewModelFactory(
        {
            id1: new Field(),
            id2: new Field(),
            name: new Field(),
        },
        {
            pkFieldName: ['id1', 'id2'],
        }
    ) {}

    const record2 = new Test2({ id1: 5, id2: 6, name: 'one' });
    Test2.cache.add(record2);
    expect(() => Test2.cache.get(1, ['name'])).toThrowError(
        'Test2 has a compound key of id1, id2. You must provide an object mapping these fields to their values.'
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => Test2.cache.get({ id1: null }, ['name'])).toThrowError(
        'Test2 has a compound key of id1, id2. Missing value(s) for field(s) id1, id2'
    );

    expect(Test2.cache.getAll(['id1', 'id2', 'name'])[0]).toBe(record2);
    expect(Test2.cache.getAll(['name'])[0]).toBe(record2);
});

test('should always use primary key in cache regardless of whether specified', () => {
    class Test1 extends viewModelFactory(
        {
            id1: new Field(),
            id2: new Field(),
            name: new Field(),
        },
        {
            pkFieldName: ['id1', 'id2'],
        }
    ) {}

    class Test2 extends viewModelFactory(
        {
            id: new Field(),
            name: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1 = new Test1({ id1: 5, id2: 6, name: 'one' });

    Test1.cache.add(record1);

    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['id1', 'id2', 'name'])).toBe(record1);
    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['id2', 'name'])).toBe(record1);
    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['id1', 'name'])).toBe(record1);
    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['name'])).toBe(record1);

    const record2 = new Test1({ id2: 6, id1: 5, name: 'two' });
    Test1.cache.add(record2);

    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['id1', 'id2', 'name'])).toBe(record2);
    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['id2', 'name'])).toBe(record2);
    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['id1', 'name'])).toBe(record2);
    expect(Test1.cache.get({ id1: 5, id2: 6 }, ['name'])).toBe(record2);

    const record3 = new Test2({ id: 1, name: 'one' });
    Test2.cache.add(record3);

    expect(Test2.cache.get(1, ['id', 'name'])).toBe(record3);
    expect(Test2.cache.get(1, ['name'])).toBe(record3);

    const record4 = new Test2({ id: 1, name: 'two' });
    Test2.cache.add(record4);

    expect(Test2.cache.get(1, ['id', 'name'])).toBe(record4);
    expect(Test2.cache.get(1, ['name'])).toBe(record4);
});

test('should support custom cache', () => {
    class MyInvalidCache {}
    expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestBad extends viewModelFactory({ id: new Field() }, { pkFieldName: 'id' }) {
            static cache = new MyInvalidCache();
        }
    }).toThrowError('cache class must extend ViewModelCache');

    class MyCache<T extends ViewModelConstructor<any, any>> extends ViewModelCache<T> {}
    class MyCache2<T extends ViewModelConstructor<any, any>> extends ViewModelCache<T> {}
    class Test1 extends viewModelFactory({ id: new Field() }, { pkFieldName: 'id' }) {
        static cache = new MyCache<typeof Test1>(Test1);
    }

    expect(Test1.cache).toBeInstanceOf(MyCache);

    // Make sure inheritance results in correct caches for everything
    class Test2 extends Test1.augment({}) {
        static cache = new MyCache2<typeof Test2>(Test2);
    }

    expect(Test1.cache).toBeInstanceOf(MyCache);
    expect(Test2.cache).toBeInstanceOf(MyCache2);
    expect(Test1.cache).not.toBe(Test2.cache);

    class Test3 extends Test1 {}
    expect(Test1.cache).not.toBe(Test3.cache);

    class Test4 extends Test1 {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        static cache = new MyCache2<Test4>(Test4);
    }
    expect(Test1.cache).not.toBe(Test4.cache);
    expect(Test4.cache).toBeInstanceOf(MyCache2);
});

test('updating a record should result in cache for subset of fields being updated', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    Test1.cache.add(new Test1({ id: 5, firstName: 'B' }));
    Test1.cache.add(new Test1({ id: 5, email: 'E' }));
    Test1.cache.add(new Test1({ id: 5, lastName: 'J' }));

    Test1.cache.add(new Test1({ id: 5, firstName: 'C', lastName: 'I' }));

    let firstName: any = Test1.cache.get(5, ['id', 'firstName']);
    expect(firstName).not.toBeNull();
    expect(firstName.toJS()).toEqual({ id: 5, firstName: 'C' });

    let lastName: any = Test1.cache.get(5, ['id', 'lastName']);
    expect(lastName).not.toBeNull();
    expect(lastName.toJS()).toEqual({ id: 5, lastName: 'I' });

    let firstLast: any = Test1.cache.get(5, ['id', 'firstName', 'lastName']);
    expect(firstLast).not.toBeNull();
    expect(firstLast.toJS()).toEqual({ id: 5, firstName: 'C', lastName: 'I' });

    Test1.cache.add(new Test1({ id: 5, firstName: 'D', email: '-' }));

    firstName = Test1.cache.get(5, ['id', 'firstName']);
    expect(firstName).not.toBeNull();
    expect(firstName.toJS()).toEqual({ id: 5, firstName: 'D' });

    let email: any = Test1.cache.get(5, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 5, email: '-' });

    let firstEmail: any = Test1.cache.get(5, ['id', 'firstName', 'email']);
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
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1 = new Test1({ id: 5, firstName: 'Bob', lastName: 'Jack', email: 'a@b.com' });
    Test1.cache.add(record1);
    const firstName: any = Test1.cache.get(5, ['id', 'firstName']);
    expect(firstName).not.toBeNull();
    expect(firstName.toJS()).toEqual({ id: 5, firstName: 'Bob' });

    const lastName: any = Test1.cache.get(5, ['id', 'lastName']);
    expect(lastName).not.toBeNull();
    expect(lastName.toJS()).toEqual({ id: 5, lastName: 'Jack' });

    let email: any = Test1.cache.get(5, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 5, email: 'a@b.com' });

    const firstLast: any = Test1.cache.get(5, ['id', 'firstName', 'lastName']);
    expect(firstLast).not.toBeNull();
    expect(firstLast.toJS()).toEqual({ id: 5, firstName: 'Bob', lastName: 'Jack' });

    const firstEmail: any = Test1.cache.get(5, ['id', 'firstName', 'email']);
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
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 2, lastName: 'Jack', email: 'jack@b.com' }));

    let email: any = Test1.cache.get(2, ['id', 'email']);
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
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 2, lastName: 'Jack', email: 'jack@b.com' }));
    Test1.cache.delete(2);

    expect(Test1.cache.get(2, ['id', 'email'])).toBeNull();
    expect(Test1.cache.get(2, ['id', 'firstName'])).toBeNull();
    expect(Test1.cache.get(2, ['id', 'lastName'])).toBeNull();
    for (let i = 0; i < 5; i++) {
        Test1.cache.add(new Test1({ id: i, firstName: `${i}` }));
    }
    expect(new Set(Test1.cache.getAll(['firstName']).map(r => r.id))).toEqual(
        new Set([0, 1, 2, 3, 4])
    );
    Test1.cache.delete(4);
    expect(new Set(Test1.cache.getAll(['firstName']).map(r => r.id))).toEqual(
        new Set([0, 1, 2, 3])
    );
});

test('should support removing records from cache for only specified field names', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 2, lastName: 'Jack', email: 'jack@b.com' }));
    Test1.cache.delete(2, ['id', 'lastName', 'email']);

    expect(Test1.cache.get(2, ['id', 'lastName'])).toBeNull();

    const email: any = Test1.cache.get(2, ['id', 'email']);
    expect(email).not.toBeNull();
    expect(email.toJS()).toEqual({ id: 2, email: 'bob@b.com' });
});

test('should support retrieving multiple records', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {
        static cache: ViewModelCache<typeof Test1> = new ViewModelCache(Test1);
    }
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 3, lastName: 'Jack', email: 'jack@b.com' }));
    Test1.cache.add(new Test1({ id: 4, firstName: 'Sam', email: 'sam@b.com' }));

    const records1 = Test1.cache.getList([2, 3, 4], ['id', 'firstName', 'email'], false);
    expect(records1).toEqual([
        recordEqualTo({ id: 2, firstName: 'Bob', email: 'bob@b.com' }),
        null,
        recordEqualTo({ id: 4, firstName: 'Sam', email: 'sam@b.com' }),
    ]);

    const records2 = Test1.cache.getList([2, 3, 4], ['id', 'email']) as Test1[];
    expect(records2).toEqual([
        recordEqualTo({ id: 2, email: 'bob@b.com' }),
        recordEqualTo({ id: 3, email: 'jack@b.com' }),
        recordEqualTo({ id: 4, email: 'sam@b.com' }),
    ]);

    expect(Test1.cache.getList(records2)).toEqual(records2);
    expect(Test1.cache.getList(records1.filter(Boolean) as Test1[])).toEqual([
        recordEqualTo({ id: 2, firstName: 'Bob', email: 'bob@b.com' }),
        recordEqualTo({ id: 4, firstName: 'Sam', email: 'sam@b.com' }),
    ]);
});

test('should support using * for all fields', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const bob = { id: 2, firstName: 'Bob', lastName: 'So', email: 'bob@b.com' };
    const jack = { id: 3, lastName: 'Jack', email: 'jack@b.com' };
    const sam = { id: 4, firstName: 'Sam', lastName: 'Gee', email: 'sam@b.com' };

    Test1.cache.add(new Test1(bob));
    Test1.cache.add(new Test1(jack));
    Test1.cache.add(new Test1(sam));

    expect(Test1.cache.get(2, '*')).toBeEqualToRecord(new Test1(bob));
    expect(Test1.cache.get(3, '*')).toEqual(null);
    expect(Test1.cache.get(4, '*')).toBeEqualToRecord(new Test1(sam));

    const records1 = Test1.cache.getList([2, 3, 4], '*', false);
    expect(records1).toEqual([recordEqualTo(bob), null, recordEqualTo(sam)]);

    const records2 = Test1.cache.getAll('*');
    expect(records2).toEqual([recordEqualTo(bob), recordEqualTo(sam)]);
});

test('should support adding list of via add', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1 = { id: 2, firstName: 'Bob', email: 'bob@b.com' };
    const record2 = { id: 3, firstName: 'Samwise', email: 'samwise@b.com' };
    const record3 = { id: 4, firstName: 'Gandalf', email: 'gandy@b.com' };
    const result = Test1.cache.add([record1, record2, record3]);

    expect(result).toEqual([
        recordEqualTo(record1),
        recordEqualTo(record2),
        recordEqualTo(record3),
    ]);
});

test('should support adding list of plain objects', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1 = { id: 2, firstName: 'Bob', email: 'bob@b.com' };
    const record2 = { id: 3, firstName: 'Samwise', email: 'samwise@b.com' };
    const record3 = { id: 4, firstName: 'Gandalf', email: 'gandy@b.com' };
    const result = Test1.cache.addList([record1, record2, record3]);

    expect(result).toEqual([
        recordEqualTo(record1),
        recordEqualTo(record2),
        recordEqualTo(record3),
    ]);
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createTestModels(circular = false, many = false) {
    class Group extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new Field<string>(),
            ...(circular
                ? {
                      ownerId: new Field<number>(),
                      owner: new RelatedViewModelField({
                          // Type here isn't typeof User as it seemed to confuse typescript.. I guess
                          // because of the circular reference
                          // eslint-disable-next-line @typescript-eslint/no-use-before-define
                          to: (): Promise<ViewModelConstructor<any, any>> => Promise.resolve(User),
                          sourceFieldName: 'ownerId',
                      }),
                  }
                : {}),
        },
        { pkFieldName: 'id' }
    ) {}
    class User extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new Field<string>(),
            groupId: many
                ? new ListField({ childField: new Field<number | null>() })
                : new Field<number | null>(),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            group: new (many ? ManyRelatedViewModelField : RelatedViewModelField)({
                to: (): Promise<typeof Group> => Promise.resolve(Group),
                sourceFieldName: 'groupId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}
    class Subscription extends viewModelFactory(
        {
            id: new Field<number>(),
            userId: new Field<number>(),
            user: new RelatedViewModelField({
                to: (): Promise<typeof User> => Promise.resolve(User),
                sourceFieldName: 'userId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}
    return { User, Group, Subscription };
}

test('cache should support traversing models', async () => {
    const { User, Group, Subscription } = createTestModels();

    Group.cache.add({ id: 1, name: 'Staff' });
    User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
    Subscription.cache.add({
        id: 1,
        userId: 1,
    });
    const r = Subscription.cache.get(1, ['userId']);
    expect(r?.userId).toBe(1);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => r?.user).toThrow(/'user' accessed on .* but was not instantiated with it/);
    expect(() => Subscription.cache.get(1, ['user'])).toThrow(/Call .*resolveViewModel\(\) first/);
    await Subscription.fields.user.resolveViewModel();
    const s = Subscription.cache.get(1, ['user']);
    expect(s).toBeEqualToRecord(
        new Subscription({
            id: 1,
            userId: 1,
            user: {
                id: 1,
                name: 'Bob',
                groupId: 1,
            },
        })
    );
    // Retrieving from cache again should give us same object
    expect(Subscription.cache.get(1, ['user'])).toBe(s);

    // If we only specify 'group' field from 'user' we shouldn't get other 'user' fields
    // apart from primary key
    expect(Subscription.cache.get(1, [['user', 'group']])).toBeEqualToRecord(
        new Subscription({
            id: 1,
            userId: 1,
            user: {
                id: 1,
                groupId: 1,
                group: {
                    id: 1,
                    name: 'Staff',
                },
            },
        })
    );

    // Cache new record with id for group but without group in cache
    // We should still be able to retrieve the 'user' field without it - we'll
    // just get the id only.
    Subscription.cache.add({
        id: 2,
        user: {
            id: 2,
            name: 'Sam',
            groupId: 3,
        },
    });
    expect(Subscription.cache.get(2, [['user', 'group']])).toBe(null);
    const record = Subscription.cache.get(2, ['user']);
    expect(record).toBeEqualToRecord(
        new Subscription({
            id: 2,
            userId: 2,
            user: {
                id: 2,
                name: 'Sam',
                groupId: 3,
            },
        })
    );
    expect(record).toBe(Subscription.cache.get(2, ['user']));
});

test('caching record with nested data should populate associated caches', async () => {
    const { User, Group, Subscription } = createTestModels(true);
    await Subscription.fields.user.resolveViewModel();

    Subscription.cache.add({
        id: 1,
        user: {
            id: 1,
            name: 'Bob',
            group: {
                id: 1,
                name: 'Staff',
                ownerId: null,
            },
        },
    });
    expect(Subscription.cache.get(1, ['id', 'userId'])).toEqual(
        new Subscription({
            id: 1,
            userId: 1,
        })
    );
    expect(Subscription.cache.get(1, ['id', 'user'])).toEqual(
        new Subscription({
            id: 1,
            userId: 1,
            user: {
                id: 1,
                name: 'Bob',
                groupId: 1,
            },
        })
    );
    expect(User.cache.get(1, ['name', 'group'])).toEqual(
        new User({
            id: 1,
            name: 'Bob',
            groupId: 1,
            group: {
                id: 1,
                name: 'Staff',
                ownerId: null,
            },
        })
    );
    expect(Group.cache.get(1, ['name'])).toEqual(
        new Group({
            id: 1,
            name: 'Staff',
        })
    );
    Subscription.cache.add({
        id: 2,
        userId: 2,
    });
    expect(Subscription.cache.get(2, ['id', 'userId'])).toEqual(
        new Subscription({
            id: 2,
            userId: 2,
        })
    );
    expect(Subscription.cache.get(2, ['id', 'user'])).toBe(null);

    // Deeply nested data
    Subscription.cache.add({
        id: 1,
        user: {
            id: 10,
            name: 'Garry',
            group: {
                id: 5,
                name: "Garry's",
                owner: {
                    id: 9,
                    name: 'Gazza',
                    groupId: 5,
                },
            },
        },
    });
    expect(User.cache.get(10, ['name', 'group'])).toEqual(
        new User({
            id: 10,
            name: 'Garry',
            group: {
                id: 5,
                name: "Garry's",
                ownerId: 9,
            },
        })
    );
    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Recursive definitions not supported in types
        User.cache.get(10, ['name', 'group', ['group', 'owner'], ['group', 'owner', 'group']])
    ).toEqual(
        new User({
            id: 10,
            name: 'Garry',
            group: {
                id: 5,
                name: "Garry's",
                owner: {
                    id: 9,
                    name: 'Gazza',
                    group: {
                        id: 5,
                        name: "Garry's",
                        ownerId: 9,
                    },
                },
            },
        })
    );
});

test('order of fields should not matter', async () => {
    const { User, Subscription } = createTestModels(true);
    await Subscription.fields.user.resolveViewModel();
    Subscription.cache.add({
        id: 1,
        user: {
            id: 10,
            name: 'Garry',
            group: {
                id: 5,
                name: "Garry's",
                owner: {
                    id: 9,
                    name: 'Gazza',
                    groupId: 5,
                },
            },
        },
    });
    expect(User.cache.get(10, ['name', 'group'])).toBe(User.cache.get(10, ['group', 'name']));
    // Using shortcut for all fields should be same as enumerating them explicitly
    expect(Subscription.cache.get(1, ['user', ['user', 'group'], ['user', 'group', 'owner']])).toBe(
        Subscription.cache.get(1, [
            ['user', 'group', 'owner'],
            ['user', 'group', 'name'],
            ['user', 'group', 'ownerId'],
            'user',
        ])
    );
});

test('should support nested paths', async () => {
    const { Subscription } = createTestModels();
    await Subscription.fields.user.resolveViewModel();
    Subscription.cache.add({
        id: 1,
        user: {
            id: 1,
            name: 'Bob',
            group: {
                id: 1,
                name: 'Staff',
            },
        },
    });
    expect(Subscription.cache.get(1, ['userId', ['user', 'name']])).toBeEqualToRecord(
        new Subscription({
            id: 1,
            userId: 1,
            user: {
                id: 1,
                name: 'Bob',
            },
        })
    );
    expect(
        Subscription.cache.get(1, [
            ['user', 'name'],
            ['user', 'group', 'name'],
        ])
    ).toBeEqualToRecord(
        new Subscription({
            id: 1,
            user: {
                id: 1,
                name: 'Bob',
                group: {
                    id: 1,
                    name: 'Staff',
                },
            },
        })
    );

    Subscription.cache.get(1, [
        ['user', 'name'],
        ['user', 'group'],
    ]);
});

test('should handle nested related when related id is updated', async () => {
    const { User } = createTestModels(true);
    await User.fields.group.resolveViewModel();

    User.cache.add({ id: 1, name: 'Bob', group: { id: 1, name: 'Staff', ownerId: 1 } });
    expect(User.cache.get(1, ['id', 'name', ['group', 'name']])).toBeEqualToRecord(
        new User({ id: 1, name: 'Bob', group: { id: 1, name: 'Staff' } })
    );
    User.cache.add({ id: 1, name: 'Bobby', groupId: 1 });
    expect(User.cache.get(1, ['id', 'name', ['group', 'name']])).toBeEqualToRecord(
        new User({ id: 1, name: 'Bobby', group: { id: 1, name: 'Staff' } })
    );
});

test('should handle nullable values', async () => {
    const { User, Group, Subscription } = createTestModels(true);
    await User.fields.group.resolveViewModel();
    User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
    Group.cache.add({ id: 1, name: 'Staff', ownerId: null });
    expect(User.cache.get(1, ['group'])).toBeEqualToRecord(
        new User({
            id: 1,
            group: {
                id: 1,
                name: 'Staff',
                ownerId: null,
            },
        })
    );
    await Subscription.fields.user.resolveViewModel();
    Subscription.cache.add({
        id: 1,
        userId: 1,
    });
    expect(Subscription.cache.get(1, [['user', 'group']])).toBeEqualToRecord(
        new Subscription({
            id: 1,
            userId: 1,
            user: {
                id: 1,
                group: {
                    id: 1,
                    name: 'Staff',
                    ownerId: null,
                },
            },
        })
    );
    expect(
        Subscription.cache.get(1, [
            ['user', 'group'],
            ['user', 'group', 'owner'],
        ])
    ).toBeEqualToRecord(
        new Subscription({
            id: 1,
            userId: 1,
            user: {
                id: 1,
                group: {
                    id: 1,
                    name: 'Staff',
                    ownerId: null,
                    owner: null,
                },
            },
        })
    );
    User.cache.add({ id: 2, name: 'Sam', groupId: null });
    expect(User.cache.get(2, ['name', ['group', 'name'], ['group', 'owner']])).toBeEqualToRecord(
        new User({
            id: 2,
            name: 'Sam',
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            group: null,
            groupId: null,
        })
    );
});

test('getList should work across caches', async () => {
    const { User, Group } = createTestModels(true);
    await User.fields.group.resolveViewModel();
    Group.cache.add({ id: 1, name: 'Staff', ownerId: 1 });
    User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
    User.cache.add({ id: 2, name: 'Sam', groupId: null });
    User.cache.add({ id: 3, name: 'Godfrey', groupId: 2 });
    Group.cache.add({ id: 2, name: 'Customers', ownerId: 2 });
    expect(User.cache.getList([1, 2, 3], ['name', ['group', 'name'], ['group', 'owner']])).toEqual([
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                groupId: 1,
                group: {
                    id: 1,
                    name: 'Staff',
                    ownerId: 1,
                    owner: {
                        id: 1,
                        name: 'Bob',
                        groupId: 1,
                    },
                },
            })
        ),
        recordEqualTo(
            new User({
                id: 2,
                name: 'Sam',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                group: null,
                groupId: null,
            })
        ),
        recordEqualTo(
            new User({
                id: 3,
                name: 'Godfrey',
                groupId: 2,
                group: {
                    id: 2,
                    name: 'Customers',
                    ownerId: 2,
                    owner: {
                        id: 2,
                        name: 'Sam',
                        groupId: null,
                    },
                },
            })
        ),
    ]);

    expect(
        User.cache.getList(
            [1, 2, 3],
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore Recursive definitions not supported in types
            ['name', 'group', ['group', 'owner'], ['group', 'owner', 'group']]
        )
    ).toEqual([
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                groupId: 1,
                group: {
                    id: 1,
                    name: 'Staff',
                    ownerId: 1,
                    owner: {
                        id: 1,
                        name: 'Bob',
                        groupId: 1,
                        group: {
                            id: 1,
                            name: 'Staff',
                            ownerId: 1,
                        },
                    },
                },
            })
        ),
        recordEqualTo(
            new User({
                id: 2,
                name: 'Sam',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                group: null,
                groupId: null,
            })
        ),
        recordEqualTo(
            new User({
                id: 3,
                name: 'Godfrey',
                groupId: 2,
                group: {
                    id: 2,
                    name: 'Customers',
                    ownerId: 2,
                    owner: {
                        id: 2,
                        name: 'Sam',
                        groupId: null,
                        group: null,
                    },
                },
            })
        ),
    ]);
});

test('getAll should work across caches', async () => {
    const { User, Group } = createTestModels(true);
    await User.fields.group.resolveViewModel();
    Group.cache.add({ id: 1, name: 'Staff', ownerId: 1 });
    User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
    User.cache.add({ id: 2, name: 'Sam', groupId: null });
    User.cache.add({ id: 3, name: 'Godfrey', groupId: 2 });
    Group.cache.add({ id: 2, name: 'Customers', ownerId: 2 });
    expect(User.cache.getAll(['name', ['group', 'name'], ['group', 'owner']])).toEqual([
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                groupId: 1,
                group: {
                    id: 1,
                    name: 'Staff',
                    ownerId: 1,
                    owner: {
                        id: 1,
                        name: 'Bob',
                        groupId: 1,
                    },
                },
            })
        ),
        recordEqualTo(
            new User({
                id: 2,
                name: 'Sam',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                group: null,
                groupId: null,
            })
        ),
        recordEqualTo(
            new User({
                id: 3,
                name: 'Godfrey',
                groupId: 2,
                group: {
                    id: 2,
                    name: 'Customers',
                    ownerId: 2,
                    owner: {
                        id: 2,
                        name: 'Sam',
                        groupId: null,
                    },
                },
            })
        ),
    ]);
    expect(User.cache.getAll(['name', ['group', 'name'], ['group', 'owner']])).toBe(
        User.cache.getAll(['name', ['group', 'name'], ['group', 'owner']])
    );

    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Recursive definitions not supported in types
        User.cache.getAll(['name', 'group', ['group', 'owner'], ['group', 'owner', 'group']])
    ).toEqual([
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                groupId: 1,
                group: {
                    id: 1,
                    name: 'Staff',
                    ownerId: 1,
                    owner: {
                        id: 1,
                        name: 'Bob',
                        groupId: 1,
                        group: {
                            id: 1,
                            name: 'Staff',
                            ownerId: 1,
                        },
                    },
                },
            })
        ),
        recordEqualTo(
            new User({
                id: 2,
                name: 'Sam',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                group: null,
                groupId: null,
            })
        ),
        recordEqualTo(
            new User({
                id: 3,
                name: 'Godfrey',
                groupId: 2,
                group: {
                    id: 2,
                    name: 'Customers',
                    ownerId: 2,
                    owner: {
                        id: 2,
                        name: 'Sam',
                        groupId: null,
                        group: null,
                    },
                },
            })
        ),
    ]);
});

test('should validate field names', async () => {
    const { Subscription } = createTestModels(true);
    await Subscription.fields.user.resolveViewModel();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => Subscription.cache.get(1, ['userId', ['user', 'nam']])).toThrowError(
        /Unknown field 'nam'/
    );
    expect(() =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Subscription.cache.get(1, [
            ['use', 'name'],
            ['user', 'group', 'name'],
            ['user', 'group', 'own'],
        ])
    ).toThrowError(/Unknown field 'use'/);

    expect(() =>
        Subscription.cache.getList(
            [1],
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            [
                ['use', 'name'],
                ['user', 'group', 'name'],
                ['user', 'group', 'own'],
            ] as FieldPath<typeof Subscription>[]
        )
    ).toThrowError(/Unknown field 'use'/);

    expect(() =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Subscription.cache.getAll([
            ['use', 'name'],
            ['user', 'group', 'name'],
            ['user', 'group', 'own'],
        ])
    ).toThrowError(/Unknown field 'use'/);
});

test('should notify listeners on add, change, delete', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
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
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

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
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
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
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const cb1 = jest.fn();
    const cb2 = jest.fn();
    Test1.cache.addListenerList([2, 3, 4], ['id', 'firstName', 'email'], cb1);
    // Add another callback - there's internal optimisations in addListenerList that we need
    // to ensure don't break this
    Test1.cache.addListenerList([2, 3, 4], ['id', 'firstName', 'email'], cb2);
    const record1 = new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' });
    const record2 = new Test1({ id: 3, firstName: 'Samwise', email: 'samwise@b.com' });
    const record3 = new Test1({ id: 4, firstName: 'Gandalf', email: 'gandy@b.com' });
    Test1.cache.addList([record1, record2, record3]);
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb1).toHaveBeenCalledWith([null, null, null], [record1, record2, record3]);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledWith([null, null, null], [record1, record2, record3]);
});

test('should support listening to multiple pks without specifying primary keys in field names', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const cb1 = jest.fn();
    Test1.cache.addListenerList([2, 3, 4], ['firstName', 'email'], cb1);
    const record1 = new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' });
    const record2 = new Test1({ id: 3, firstName: 'Samwise', email: 'samwise@b.com' });
    const record3 = new Test1({ id: 4, firstName: 'Gandalf', email: 'gandy@b.com' });
    Test1.cache.addList([record1, record2, record3]);
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb1).toHaveBeenCalledWith([null, null, null], [record1, record2, record3]);
});

// Run this test both with and without listeners. Code path is different between the two (optimisation for
// when no listeners in use)
test.each`
    withListeners
    ${true}
    ${false}
`('Should support getting all records, listeners = $withListeners ', ({ withListeners }) => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1 = { id: 2, firstName: 'Bob', email: 'bob@b.com' };
    const record2 = { id: 3, firstName: 'Samwise', email: 'samwise@b.com' };
    const record3 = { id: 4, firstName: 'Gandalf', email: 'gandy@b.com' };
    Test1.cache.add([record1, record2, record3]);

    if (withListeners) {
        Test1.cache.addListener([2, 3, 4], ['id', 'firstName', 'email'], jest.fn());
        Test1.cache.addListener([2, 3, 4], ['id', 'firstName'], jest.fn());
    }

    let result = Test1.cache.getAll(['firstName', 'email']);

    expect(result).toEqual([
        recordEqualTo(record1),
        recordEqualTo(record2),
        recordEqualTo(record3),
    ]);

    // Calling it again should return the same array (strict equality pass)
    expect(result).toBe(Test1.cache.getAll(['firstName', 'email']));

    // Getting subfields should work and not break equality checks
    let result2 = Test1.cache.getAll(['firstName']);

    expect(result).toBe(Test1.cache.getAll(['firstName', 'email']));

    expect(result2).toEqual([
        recordEqualTo({ id: 2, firstName: 'Bob' }),
        recordEqualTo({ id: 3, firstName: 'Samwise' }),
        recordEqualTo({ id: 4, firstName: 'Gandalf' }),
    ]);
    expect(result2).toBe(Test1.cache.getAll(['firstName']));

    Test1.cache.add(record1);
    expect(result).toBe(Test1.cache.getAll(['firstName', 'email']));
    expect(result2).toBe(Test1.cache.getAll(['firstName']));

    Test1.cache.add({ ...record1, firstName: 'Bobby' });

    expect(result).not.toBe(Test1.cache.getAll(['firstName', 'email']));
    expect(result2).not.toBe(Test1.cache.getAll(['firstName']));

    result = Test1.cache.getAll(['firstName', 'email']);
    result2 = Test1.cache.getAll(['firstName']);

    expect(result[0].firstName).toBe('Bobby');
    expect(result2[0].firstName).toBe('Bobby');

    expect(result).toBe(Test1.cache.getAll(['firstName', 'email']));
    expect(result2).toBe(Test1.cache.getAll(['firstName']));
});

test('should support listening all changes on a ViewModel', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            lastName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    const cb1 = jest.fn();
    const cb2 = jest.fn();
    Test1.cache.addListener(cb1);
    Test1.cache.addListener(cb2);
    const record1 = new Test1({ id: 2, firstName: 'Bob', email: 'bob@b.com' });
    const record2 = new Test1({ id: 3, firstName: 'Samwise', email: 'samwise@b.com' });
    const record3 = new Test1({ id: 4, firstName: 'Gandalf', email: 'gandy@b.com' });
    Test1.cache.addList([record1, record2, record3]);
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);

    Test1.cache.add({ id: 6, firstName: 'Ho' });

    expect(cb1).toHaveBeenCalledTimes(2);
    expect(cb2).toHaveBeenCalledTimes(2);

    Test1.cache.delete(6);
    expect(cb1).toHaveBeenCalledTimes(3);
    expect(cb2).toHaveBeenCalledTimes(3);

    // Shouldn't call it again, record already deleted
    Test1.cache.delete(6);
    expect(cb1).toHaveBeenCalledTimes(3);
    expect(cb2).toHaveBeenCalledTimes(3);
});

test('listeners should work across related models', async () => {
    const { User, Group } = createTestModels(true);
    await User.fields.group.resolveViewModel();
    const userListenerSimple = jest.fn();
    const userListenerNested = jest.fn();
    const userListenerAll = jest.fn();
    const groupListenerSimple = jest.fn();
    const groupListenerNested = jest.fn();
    const groupListenerAll = jest.fn();
    const listeners = [
        userListenerAll,
        userListenerNested,
        userListenerSimple,
        groupListenerSimple,
        groupListenerAll,
        groupListenerNested,
    ];
    const resetCbs = (): void => {
        listeners.forEach(cb => {
            cb.mockReset();
        });
    };
    const unsubFns = [
        User.cache.addListener(1, ['id', 'name'], userListenerSimple),
        User.cache.addListener(1, ['id', 'name', 'group'], userListenerNested),
        User.cache.addListener(userListenerAll),
        Group.cache.addListener(2, ['id', 'name', 'ownerId'], groupListenerSimple),
        Group.cache.addListener(2, ['id', 'name', 'owner'], groupListenerNested),
        Group.cache.addListener(groupListenerAll),
    ];
    User.cache.add({
        id: 1,
        name: 'Bob',
        group: {
            id: 2,
            name: 'Staff',
            ownerId: 1,
        },
    });
    expect(userListenerAll).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledWith(
        null,
        recordEqualTo(new User({ id: 1, name: 'Bob' }))
    );
    expect(userListenerNested).toHaveBeenCalledWith(
        null,
        recordEqualTo(new User({ id: 1, name: 'Bob', group: { id: 2, name: 'Staff', ownerId: 1 } }))
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledWith(
        null,
        recordEqualTo(new Group({ id: 2, name: 'Staff', ownerId: 1 }))
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        null,
        recordEqualTo(
            new Group({ id: 2, name: 'Staff', owner: { id: 1, name: 'Bob', groupId: 2 } })
        )
    );
    resetCbs();

    Group.cache.add({
        id: 2,
        name: 'Management',
        ownerId: 1,
    });
    expect(userListenerAll).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledTimes(0);
    expect(userListenerNested).toHaveBeenCalledTimes(1);
    expect(userListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new User({ id: 1, name: 'Bob', group: { id: 2, name: 'Staff', ownerId: 1 } })
        ),
        recordEqualTo(
            new User({ id: 1, name: 'Bob', group: { id: 2, name: 'Management', ownerId: 1 } })
        )
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledWith(
        recordEqualTo(new Group({ id: 2, name: 'Staff', ownerId: 1 })),
        recordEqualTo(new Group({ id: 2, name: 'Management', ownerId: 1 }))
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Group({ id: 2, name: 'Staff', owner: { id: 1, name: 'Bob', groupId: 2 } })
        ),
        recordEqualTo(
            new Group({ id: 2, name: 'Management', owner: { id: 1, name: 'Bob', groupId: 2 } })
        )
    );
    resetCbs();
    User.cache.add({
        id: 1,
        name: 'Bobby',
        groupId: 2,
    });
    expect(groupListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Group({ id: 2, name: 'Management', owner: { id: 1, name: 'Bob', groupId: 2 } })
        ),
        recordEqualTo(
            new Group({ id: 2, name: 'Management', owner: { id: 1, name: 'Bobby', groupId: 2 } })
        )
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledTimes(0);

    resetCbs();

    unsubFns.forEach(unsub => unsub());

    User.cache.add({
        id: 1,
        name: 'Bob',
        group: {
            id: 2,
            name: 'Staff',
            ownerId: 1,
        },
    });
    listeners.forEach(listener => {
        expect(listener).not.toHaveBeenCalled();
    });
});

test('listeners should work across deeply nested related models', async () => {
    const { User, Group, Subscription } = createTestModels(true);
    await Subscription.fields.user.resolveViewModel();
    await User.fields.group.resolveViewModel();
    const subscriptionListenerSimple = jest.fn();
    const subscriptionListenerNested = jest.fn();
    const subscriptionListenerAll = jest.fn();
    const userListenerSimple = jest.fn();
    const userListenerNested = jest.fn();
    const userListenerAll = jest.fn();
    const groupListenerSimple = jest.fn();
    const groupListenerNested = jest.fn();
    const groupListenerAll = jest.fn();
    const unsubFns = [
        Subscription.cache.addListener(1, ['id', 'userId'], subscriptionListenerSimple),
        Subscription.cache.addListener(
            1,
            [
                'id',
                ['user', 'name'],
                ['user', 'group', 'name'],
                ['user', 'group', 'owner', 'name'],
            ] as FieldPath<typeof Subscription>[],
            subscriptionListenerNested
        ),
        Subscription.cache.addListener(subscriptionListenerAll),
        User.cache.addListener(1, ['id', 'name'], userListenerSimple),
        User.cache.addListener(1, ['id', 'name', 'group'], userListenerNested),
        User.cache.addListener(userListenerAll),
        Group.cache.addListener(1, ['id', 'name', 'ownerId'], groupListenerSimple),
        Group.cache.addListener(1, ['id', 'name', 'owner'], groupListenerNested),
        Group.cache.addListener(groupListenerAll),
    ];
    const listeners = [
        subscriptionListenerSimple,
        subscriptionListenerNested,
        subscriptionListenerAll,
        userListenerAll,
        userListenerNested,
        userListenerSimple,
        groupListenerSimple,
        groupListenerAll,
        groupListenerNested,
    ];
    const resetCbs = (): void => {
        listeners.forEach(cb => {
            cb.mockReset();
        });
    };
    Subscription.cache.add({
        id: 1,
        user: {
            id: 1,
            name: 'Bob',
            group: {
                id: 1,
                name: 'Staff',
                ownerId: 1,
            },
        },
    });
    expect(subscriptionListenerAll).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerSimple).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerSimple).toHaveBeenCalledWith(
        null,
        recordEqualTo(new Subscription({ id: 1, userId: 1 }))
    );
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        null,
        recordEqualTo(
            new Subscription({
                id: 1,
                user: {
                    id: 1,
                    name: 'Bob',
                    group: { id: 1, name: 'Staff', owner: { id: 1, name: 'Bob' } },
                },
            })
        )
    );
    expect(userListenerAll).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledWith(
        null,
        recordEqualTo(new User({ id: 1, name: 'Bob' }))
    );
    expect(userListenerNested).toHaveBeenCalledWith(
        null,
        recordEqualTo(new User({ id: 1, name: 'Bob', group: { id: 1, name: 'Staff', ownerId: 1 } }))
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledWith(
        null,
        recordEqualTo(new Group({ id: 1, name: 'Staff', ownerId: 1 }))
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        null,
        recordEqualTo(
            new Group({ id: 1, name: 'Staff', owner: { id: 1, name: 'Bob', groupId: 1 } })
        )
    );

    resetCbs();

    Group.cache.add({
        id: 1,
        name: 'Management',
        ownerId: 1,
    });
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Subscription({
                id: 1,
                user: {
                    id: 1,
                    name: 'Bob',
                    group: { id: 1, name: 'Staff', owner: { id: 1, name: 'Bob' } },
                },
            })
        ),
        recordEqualTo(
            new Subscription({
                id: 1,
                user: {
                    id: 1,
                    name: 'Bob',
                    group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bob' } },
                },
            })
        )
    );

    expect(userListenerAll).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledTimes(0);
    expect(userListenerNested).toHaveBeenCalledTimes(1);
    expect(userListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new User({ id: 1, name: 'Bob', group: { id: 1, name: 'Staff', ownerId: 1 } })
        ),
        recordEqualTo(
            new User({ id: 1, name: 'Bob', group: { id: 1, name: 'Management', ownerId: 1 } })
        )
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledWith(
        recordEqualTo(new Group({ id: 1, name: 'Staff', ownerId: 1 })),
        recordEqualTo(new Group({ id: 1, name: 'Management', ownerId: 1 }))
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Group({ id: 1, name: 'Staff', owner: { id: 1, name: 'Bob', groupId: 1 } })
        ),
        recordEqualTo(
            new Group({ id: 1, name: 'Management', owner: { id: 1, name: 'Bob', groupId: 1 } })
        )
    );
    resetCbs();
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(0);
    // console.log('****************************************************************************');
    User.cache.add({
        id: 1,
        name: 'Bobby',
        groupId: 1,
    });
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);
    // console.log(JSON.stringify(subscriptionListenerNested.mock.calls[0][0].toJS(), null, 2));
    // console.log(JSON.stringify(subscriptionListenerNested.mock.calls[0][1].toJS(), null, 2));
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Subscription({
                id: 1,
                user: {
                    id: 1,
                    name: 'Bob',
                    group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bob' } },
                },
            })
        ),
        recordEqualTo(
            new Subscription({
                id: 1,
                user: {
                    id: 1,
                    name: 'Bobby',
                    group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bobby' } },
                },
            })
        )
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Group({ id: 1, name: 'Management', owner: { id: 1, name: 'Bob', groupId: 1 } })
        ),
        recordEqualTo(
            new Group({ id: 1, name: 'Management', owner: { id: 1, name: 'Bobby', groupId: 1 } })
        )
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledTimes(0);

    resetCbs();

    Subscription.cache.delete(1);
    expect(subscriptionListenerAll).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Subscription({
                id: 1,
                user: {
                    id: 1,
                    name: 'Bobby',
                    group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bobby' } },
                },
            })
        ),
        null
    );
    expect(subscriptionListenerSimple).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerSimple).toHaveBeenCalledWith(
        recordEqualTo(
            new Subscription({
                id: 1,
                userId: 1,
            })
        ),
        null
    );
    expect(groupListenerSimple).not.toHaveBeenCalled();
    expect(groupListenerNested).not.toHaveBeenCalled();
    expect(groupListenerAll).not.toHaveBeenCalled();
    expect(userListenerSimple).not.toHaveBeenCalled();
    expect(userListenerNested).not.toHaveBeenCalled();
    expect(userListenerAll).not.toHaveBeenCalled();
    resetCbs();
    unsubFns.forEach(cb => cb());
    Subscription.cache.add({
        id: 1,
        user: {
            id: 1,
            name: 'Bob1',
            group: {
                id: 1,
                name: 'Staff1',
                ownerId: 1,
            },
        },
    });
    expect(subscriptionListenerSimple).not.toHaveBeenCalled();
    expect(subscriptionListenerNested).not.toHaveBeenCalled();
    expect(subscriptionListenerAll).not.toHaveBeenCalled();
    expect(groupListenerSimple).not.toHaveBeenCalled();
    expect(groupListenerNested).not.toHaveBeenCalled();
    expect(groupListenerAll).not.toHaveBeenCalled();
    expect(userListenerSimple).not.toHaveBeenCalled();
    expect(userListenerNested).not.toHaveBeenCalled();
    expect(userListenerAll).not.toHaveBeenCalled();
});

test('should notify listener own change to deeply nested record', async () => {
    /**
     * This was introduced as multiple level relations were not calling listeners at the root
     * level on change
     */
    class Owner extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new Field<string>(),
        },
        { pkFieldName: 'id' }
    ) {}
    class Section extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new Field<string>(),
            ownerId: new Field(),
            owner: new RelatedViewModelField({
                to: Owner,
                sourceFieldName: 'ownerId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}
    class Group extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new Field<string>(),
            sectionIds: new ListField({ childField: new Field() }),
            sections: new ManyRelatedViewModelField({
                to: Section,
                sourceFieldName: 'sectionIds',
            }),
        },
        { pkFieldName: 'id' }
    ) {}
    class User extends viewModelFactory(
        {
            id: new Field<number>(),
            groupIds: new ListField({ childField: new Field<number | null>() }),
            groups: new ManyRelatedViewModelField({
                to: Group,
                sourceFieldName: 'groupIds',
            }),
        },
        { pkFieldName: 'id' }
    ) {}
    User.cache.add({
        id: 1,
        groups: [
            {
                id: 1,
                name: 'A',
                sections: [{ id: 1, name: 'Section A', owner: { id: 1, name: 'Owner' } }],
            },
        ],
    });
    User.cache.add({
        id: 2,
        groups: [
            {
                id: 2,
                name: 'B',
                sections: [{ id: 2, name: 'Section B', owner: { id: 2, name: 'Owner 2' } }],
            },
        ],
    });
    const cb1 = jest.fn();
    User.cache.addListener(
        1,
        [
            'id',
            ['groups', 'name'],
            ['groups', 'sections', 'name'],
            ['groups', 'sections', 'owner', 'name'],
        ],
        cb1
    );
    const cb2 = jest.fn();
    User.cache.addListener(
        2,
        [
            'id',
            ['groups', 'name'],
            ['groups', 'sections', 'name'],
            ['groups', 'sections', 'owner', 'name'],
        ],
        cb2
    );
    Owner.cache.add({ id: 1, name: 'New Owner' });
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();
    cb1.mockReset();

    Owner.cache.add({ id: 2, name: 'Owner Two' });
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb1).not.toHaveBeenCalled();
});

test('getting a subset of keys should not trigger listeners', async () => {
    const { User, Subscription } = createTestModels(true);
    await Subscription.fields.user.resolveViewModel();
    await User.fields.group.resolveViewModel();
    const subscriptionListenerNested = jest.fn();

    Subscription.cache.add({
        id: 1,
        user: {
            id: 1,
            name: 'Bob',
            group: {
                id: 1,
                name: 'Staff',
                ownerId: 1,
            },
        },
    });

    Subscription.cache.addListener(
        1,
        [
            'id',
            ['user', 'name'],
            ['user', 'group', 'name'],
            ['user', 'group', 'owner', 'name'],
        ] as FieldPath<typeof Subscription>[],
        subscriptionListenerNested
    );

    expect(
        Subscription.cache.get(1, [
            'id',
            ['user', 'name'],
            ['user', 'group', 'name'],
            ['user', 'group', 'owner', 'name'],
        ] as FieldPath<typeof Subscription>[])
    ).toEqual(
        new Subscription({
            id: 1,
            userId: 1,
            user: {
                id: 1,
                name: 'Bob',
                groupId: 1,
                group: { id: 1, name: 'Staff', ownerId: 1, owner: { id: 1, name: 'Bob' } },
            },
        })
    );
    expect(subscriptionListenerNested).not.toHaveBeenCalled();
});

test('deletes should still work if listener added after record created', async () => {
    const { User, Group, Subscription } = createTestModels(true);
    await Subscription.fields.user.resolveViewModel();
    await User.fields.group.resolveViewModel();
    const subscriptionListenerNested = jest.fn();
    const userListenerNested = jest.fn();

    Subscription.cache.add({
        id: 1,
        user: {
            id: 1,
            name: 'Bob',
            group: {
                id: 1,
                name: 'Staff',
                ownerId: 1,
            },
        },
    });

    Subscription.cache.addListener(
        1,
        [
            'id',
            ['user', 'name'],
            ['user', 'group', 'name'],
            ['user', 'group', 'owner', 'name'],
        ] as FieldPath<typeof Subscription>[],
        subscriptionListenerNested
    );
    User.cache.addListener(1, ['id', 'name', 'group'], userListenerNested);
    Group.cache.delete(1);
    expect(User.cache.get(1, ['id', 'name', 'group'])).toBeNull();
    expect(userListenerNested).toHaveBeenCalledTimes(1);
    expect(userListenerNested).toHaveBeenCalledWith(
        new User({
            id: 1,
            name: 'Bob',
            groupId: 1,
            group: {
                id: 1,
                name: 'Staff',
                ownerId: 1,
            },
        }),
        null
    );
    expect(
        Subscription.cache.get(1, [
            'id',
            ['user', 'name'],
            ['user', 'group', 'name'],
            ['user', 'group', 'owner', 'name'],
        ] as FieldPath<typeof Subscription>[])
    ).toBeNull();
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Subscription({
                id: 1,
                userId: 1,
                user: {
                    id: 1,
                    name: 'Bob',
                    groupId: 1,
                    group: { id: 1, name: 'Staff', ownerId: 1, owner: { id: 1, name: 'Bob' } },
                },
            })
        ),
        null
    );
});

test('deletes should work across deeply nested related models', async () => {
    const { User, Group, Subscription } = createTestModels(true);
    await Subscription.fields.user.resolveViewModel();
    await User.fields.group.resolveViewModel();
    const subscriptionListenerNested = jest.fn();
    const userListenerNested = jest.fn();

    Subscription.cache.addListener(
        1,
        [
            'id',
            ['user', 'name'],
            ['user', 'group', 'name'],
            ['user', 'group', 'owner', 'name'],
        ] as FieldPath<typeof Subscription>[],
        subscriptionListenerNested
    );
    User.cache.addListener(1, ['id', 'name', 'group'], userListenerNested);

    Subscription.cache.add({
        id: 1,
        user: {
            id: 1,
            name: 'Bob',
            group: {
                id: 1,
                name: 'Staff',
                ownerId: 1,
            },
        },
    });

    expect(userListenerNested).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);

    Group.cache.delete(1);

    expect(userListenerNested).toHaveBeenCalledTimes(2);
    expect(userListenerNested).toHaveBeenCalledWith(
        new User({
            id: 1,
            name: 'Bob',
            groupId: 1,
            group: {
                id: 1,
                name: 'Staff',
                ownerId: 1,
            },
        }),
        null
    );
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(2);
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        new Subscription({
            id: 1,
            user: {
                id: 1,
                name: 'Bob',
                group: { id: 1, name: 'Staff', owner: { id: 1, name: 'Bob' } },
            },
        }),
        null
    );
});

test('listeners should handle missing nested', async () => {
    const { Subscription, User } = createTestModels(true);
    const cb = jest.fn();
    await Subscription.fields.user.resolveViewModel();
    Subscription.cache.addListener(
        1,
        [
            ['user', 'group'],
            ['user', 'group', 'owner'],
        ],
        cb
    );
    User.cache.add({
        id: 1,
        name: 'Bob',
        groupId: null,
    });
    Subscription.cache.add({
        id: 1,
        userId: 1,
    });
    expect(cb).toHaveBeenCalledWith(
        null,
        new Subscription({
            id: 1,
            userId: 1,
            user: {
                id: 1,
                groupId: null,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                group: null,
            },
        })
    );
});

test('listeners should work across related models with partial fields', async () => {
    class Group extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new Field<string>(),
            ownerId: new Field<number>(),
            owner: new RelatedViewModelField({
                // Type here isn't typeof User as it seemed to confuse typescript.. I guess
                // because of the circular reference
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                to: (): Promise<ViewModelConstructor<any, any>> => Promise.resolve(User),
                sourceFieldName: 'ownerId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}
    class User extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new Field<string>(),
            email: new Field<string>(),
            groupId: new Field<number | null>(),
            group: new RelatedViewModelField({
                to: (): Promise<typeof Group> => Promise.resolve(Group),
                sourceFieldName: 'groupId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}
    class Subscription extends viewModelFactory(
        {
            id: new Field<number>(),
            label: new Field<string>(),
            userId: new Field<number>(),
            user: new RelatedViewModelField<typeof User>({
                to: (): Promise<typeof User> => Promise.resolve(User),
                sourceFieldName: 'userId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}
    await Subscription.fields.user.resolveViewModel();
    const subscriptionListenerNested = jest.fn();
    Subscription.cache.addListener(
        1,
        ['id', ['user', 'group', 'name'], ['user', 'group', 'owner', 'email']],
        subscriptionListenerNested
    );
    Subscription.cache.add({
        id: 1,
        user: {
            id: 1,
            name: 'Bob',
            group: {
                id: 1,
                name: 'Staff',
                ownerId: 1,
            },
        },
    });
    expect(subscriptionListenerNested).not.toHaveBeenCalled();
    User.cache.add({
        id: 2,
        name: 'Sam',
        email: 'sam@sam.com',
        groupId: 1,
    });
    Subscription.cache.add({
        id: 1,
        user: {
            id: 1,
            name: 'Bob',
            email: 'bob@bob.com',
            group: {
                id: 1,
                name: 'Staff',
                ownerId: 2,
            },
        },
    });
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerNested).toHaveBeenLastCalledWith(
        null,
        recordEqualTo(
            new Subscription({
                id: 1,
                userId: 1,
                user: {
                    id: 1,
                    groupId: 1,
                    group: {
                        id: 1,
                        name: 'Staff',
                        ownerId: 2,
                        owner: {
                            id: 2,
                            email: 'sam@sam.com',
                        },
                    },
                },
            })
        )
    );
    User.cache.add({ id: 2, name: 'Samuel' });
    // No new calls, doesn't contain email
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);
    User.cache.add({ id: 2, name: 'Samuel', email: 'samuel@sam.com' });
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(2);
    expect(subscriptionListenerNested).toHaveBeenLastCalledWith(
        recordEqualTo(
            new Subscription({
                id: 1,
                userId: 1,
                user: {
                    id: 1,
                    groupId: 1,
                    group: {
                        id: 1,
                        name: 'Staff',
                        ownerId: 2,
                        owner: {
                            id: 2,
                            email: 'sam@sam.com',
                        },
                    },
                },
            })
        ),
        recordEqualTo(
            new Subscription({
                id: 1,
                userId: 1,
                user: {
                    id: 1,
                    groupId: 1,
                    group: {
                        id: 1,
                        name: 'Staff',
                        ownerId: 2,
                        owner: {
                            id: 2,
                            email: 'samuel@sam.com',
                        },
                    },
                },
            })
        )
    );
    User.cache.add({ id: 2, email: 'samwise@sam.com' });
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(3);
    expect(subscriptionListenerNested).toHaveBeenLastCalledWith(
        recordEqualTo(
            new Subscription({
                id: 1,
                userId: 1,
                user: {
                    id: 1,
                    groupId: 1,
                    group: {
                        id: 1,
                        name: 'Staff',
                        ownerId: 2,
                        owner: {
                            id: 2,
                            email: 'samuel@sam.com',
                        },
                    },
                },
            })
        ),
        recordEqualTo(
            new Subscription({
                id: 1,
                userId: 1,
                user: {
                    id: 1,
                    groupId: 1,
                    group: {
                        id: 1,
                        name: 'Staff',
                        ownerId: 2,
                        owner: {
                            id: 2,
                            email: 'samwise@sam.com',
                        },
                    },
                },
            })
        )
    );
});

test('list listeners should work across related models', async () => {
    const { User, Group, Subscription } = createTestModels(true);
    await Subscription.fields.user.resolveViewModel();
    await User.fields.group.resolveViewModel();
    const subscriptionListenerSimple = jest.fn();
    const subscriptionListenerNested = jest.fn();
    const subscriptionListenerAll = jest.fn();
    const userListenerSimple = jest.fn();
    const userListenerNested = jest.fn();
    const userListenerAll = jest.fn();
    const groupListenerSimple = jest.fn();
    const groupListenerNested = jest.fn();
    const groupListenerAll = jest.fn();
    const unsubFns = [
        Subscription.cache.addListenerList([1, 2, 3], ['id', 'userId'], subscriptionListenerSimple),
        Subscription.cache.addListener(
            [1, 2, 3],
            [
                'id',
                ['user', 'name'],
                ['user', 'group', 'name'],
                ['user', 'group', 'owner', 'name'],
            ] as FieldPath<typeof Subscription>[],
            subscriptionListenerNested
        ),
        Subscription.cache.addListener(subscriptionListenerAll),
        User.cache.addListener([1, 2], ['id', 'name'], userListenerSimple),
        User.cache.addListener([1, 2], ['id', 'name', 'group'], userListenerNested),
        User.cache.addListener(userListenerAll),
        Group.cache.addListener([1, 2], ['id', 'name', 'ownerId'], groupListenerSimple),
        Group.cache.addListener([1, 2], ['id', 'name', 'owner'], groupListenerNested),
        Group.cache.addListener(groupListenerAll),
    ];
    const listeners = [
        subscriptionListenerSimple,
        subscriptionListenerNested,
        subscriptionListenerAll,
        userListenerAll,
        userListenerNested,
        userListenerSimple,
        groupListenerSimple,
        groupListenerAll,
        groupListenerNested,
    ];
    const resetCbs = (): void => {
        listeners.forEach(cb => {
            cb.mockReset();
        });
    };
    Subscription.cache.addList([
        {
            id: 1,
            user: {
                id: 1,
                name: 'Bob',
                group: {
                    id: 1,
                    name: 'Staff',
                    ownerId: 1,
                },
            },
        },
        {
            id: 2,
            user: {
                id: 1,
                name: 'Bob',
                group: {
                    id: 1,
                    name: 'Staff',
                    ownerId: 1,
                },
            },
        },
        {
            id: 3,
            user: {
                id: 2,
                name: 'Sam',
                group: {
                    id: 2,
                    name: 'Customers',
                    ownerId: 1,
                },
            },
        },
    ]);
    expect(subscriptionListenerAll).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerSimple).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerSimple).toHaveBeenCalledWith(
        [null, null, null],
        [
            recordEqualTo(new Subscription({ id: 1, userId: 1 })),
            recordEqualTo(new Subscription({ id: 2, userId: 1 })),
            recordEqualTo(new Subscription({ id: 3, userId: 2 })),
        ]
    );
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        [null, null, null],
        [
            recordEqualTo(
                new Subscription({
                    id: 1,
                    user: {
                        id: 1,
                        name: 'Bob',
                        group: { id: 1, name: 'Staff', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 2,
                    user: {
                        id: 1,
                        name: 'Bob',
                        group: { id: 1, name: 'Staff', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 3,
                    user: {
                        id: 2,
                        name: 'Sam',
                        group: { id: 2, name: 'Customers', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
        ]
    );
    expect(userListenerAll).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledWith(
        [null, null],
        [
            recordEqualTo(new User({ id: 1, name: 'Bob' })),
            recordEqualTo(new User({ id: 2, name: 'Sam' })),
        ]
    );
    expect(userListenerNested).toHaveBeenCalledWith(
        [null, null],
        [
            recordEqualTo(
                new User({ id: 1, name: 'Bob', group: { id: 1, name: 'Staff', ownerId: 1 } })
            ),
            recordEqualTo(
                new User({ id: 2, name: 'Sam', group: { id: 2, name: 'Customers', ownerId: 1 } })
            ),
        ]
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledWith(
        [null, null],
        [
            recordEqualTo(new Group({ id: 1, name: 'Staff', ownerId: 1 })),
            recordEqualTo(new Group({ id: 2, name: 'Customers', ownerId: 1 })),
        ]
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        [null, null],
        [
            recordEqualTo(
                new Group({ id: 1, name: 'Staff', owner: { id: 1, name: 'Bob', groupId: 1 } })
            ),
            recordEqualTo(
                new Group({ id: 2, name: 'Customers', owner: { id: 1, name: 'Bob', groupId: 1 } })
            ),
        ]
    );

    resetCbs();

    Group.cache.add({
        id: 1,
        name: 'Management',
        ownerId: 1,
    });
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        [
            recordEqualTo(
                new Subscription({
                    id: 1,
                    user: {
                        id: 1,
                        name: 'Bob',
                        group: { id: 1, name: 'Staff', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 2,
                    user: {
                        id: 1,
                        name: 'Bob',
                        group: { id: 1, name: 'Staff', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 3,
                    user: {
                        id: 2,
                        name: 'Sam',
                        group: { id: 2, name: 'Customers', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
        ],
        [
            recordEqualTo(
                new Subscription({
                    id: 1,
                    user: {
                        id: 1,
                        name: 'Bob',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 2,
                    user: {
                        id: 1,
                        name: 'Bob',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 3,
                    user: {
                        id: 2,
                        name: 'Sam',
                        group: { id: 2, name: 'Customers', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
        ]
    );

    expect(userListenerAll).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledTimes(0);
    expect(userListenerNested).toHaveBeenCalledTimes(1);
    expect(userListenerNested).toHaveBeenCalledWith(
        [
            recordEqualTo(
                new User({ id: 1, name: 'Bob', group: { id: 1, name: 'Staff', ownerId: 1 } })
            ),
            recordEqualTo(
                new User({ id: 2, name: 'Sam', group: { id: 2, name: 'Customers', ownerId: 1 } })
            ),
        ],
        [
            recordEqualTo(
                new User({ id: 1, name: 'Bob', group: { id: 1, name: 'Management', ownerId: 1 } })
            ),
            recordEqualTo(
                new User({ id: 2, name: 'Sam', group: { id: 2, name: 'Customers', ownerId: 1 } })
            ),
        ]
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledWith(
        [
            recordEqualTo(new Group({ id: 1, name: 'Staff', ownerId: 1 })),
            recordEqualTo(new Group({ id: 2, name: 'Customers', ownerId: 1 })),
        ],
        [
            recordEqualTo(new Group({ id: 1, name: 'Management', ownerId: 1 })),
            recordEqualTo(new Group({ id: 2, name: 'Customers', ownerId: 1 })),
        ]
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        [
            recordEqualTo(
                new Group({ id: 1, name: 'Staff', owner: { id: 1, name: 'Bob', groupId: 1 } })
            ),
            recordEqualTo(
                new Group({ id: 2, name: 'Customers', owner: { id: 1, name: 'Bob', groupId: 1 } })
            ),
        ],
        [
            recordEqualTo(
                new Group({ id: 1, name: 'Management', owner: { id: 1, name: 'Bob', groupId: 1 } })
            ),
            recordEqualTo(
                new Group({ id: 2, name: 'Customers', owner: { id: 1, name: 'Bob', groupId: 1 } })
            ),
        ]
    );
    resetCbs();
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(0);
    User.cache.add({
        id: 1,
        name: 'Bobby',
        groupId: 1,
    });
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        [
            recordEqualTo(
                new Subscription({
                    id: 1,
                    user: {
                        id: 1,
                        name: 'Bob',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 2,
                    user: {
                        id: 1,
                        name: 'Bob',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 3,
                    user: {
                        id: 2,
                        name: 'Sam',
                        group: { id: 2, name: 'Customers', owner: { id: 1, name: 'Bob' } },
                    },
                })
            ),
        ],
        [
            recordEqualTo(
                new Subscription({
                    id: 1,
                    user: {
                        id: 1,
                        name: 'Bobby',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bobby' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 2,
                    user: {
                        id: 1,
                        name: 'Bobby',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bobby' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 3,
                    user: {
                        id: 2,
                        name: 'Sam',
                        group: { id: 2, name: 'Customers', owner: { id: 1, name: 'Bobby' } },
                    },
                })
            ),
        ]
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        [
            recordEqualTo(
                new Group({ id: 1, name: 'Management', owner: { id: 1, name: 'Bob', groupId: 1 } })
            ),
            recordEqualTo(
                new Group({ id: 2, name: 'Customers', owner: { id: 1, name: 'Bob', groupId: 1 } })
            ),
        ],
        [
            recordEqualTo(
                new Group({
                    id: 1,
                    name: 'Management',
                    owner: { id: 1, name: 'Bobby', groupId: 1 },
                })
            ),
            recordEqualTo(
                new Group({ id: 2, name: 'Customers', owner: { id: 1, name: 'Bobby', groupId: 1 } })
            ),
        ]
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledTimes(0);
    resetCbs();
    Group.cache.addList([
        {
            id: 1,
            name: 'Management',
            owner: {
                id: 1,
                name: 'Bazza',
                groupId: 1,
            },
        },
        {
            id: 2,
            name: 'Customer',
            owner: {
                id: 1,
                name: 'Baz',
                groupId: 1,
            },
        },
    ]);
    expect(subscriptionListenerNested).toHaveBeenCalledTimes(1);
    expect(subscriptionListenerNested).toHaveBeenCalledWith(
        [
            recordEqualTo(
                new Subscription({
                    id: 1,
                    user: {
                        id: 1,
                        name: 'Bobby',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bobby' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 2,
                    user: {
                        id: 1,
                        name: 'Bobby',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Bobby' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 3,
                    user: {
                        id: 2,
                        name: 'Sam',
                        group: { id: 2, name: 'Customers', owner: { id: 1, name: 'Bobby' } },
                    },
                })
            ),
        ],
        [
            recordEqualTo(
                new Subscription({
                    id: 1,
                    user: {
                        id: 1,
                        name: 'Baz',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Baz' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 2,
                    user: {
                        id: 1,
                        name: 'Baz',
                        group: { id: 1, name: 'Management', owner: { id: 1, name: 'Baz' } },
                    },
                })
            ),
            recordEqualTo(
                new Subscription({
                    id: 3,
                    user: {
                        id: 2,
                        name: 'Sam',
                        group: { id: 2, name: 'Customer', owner: { id: 1, name: 'Baz' } },
                    },
                })
            ),
        ]
    );
    expect(groupListenerNested).toHaveBeenCalledTimes(1);
    expect(groupListenerNested).toHaveBeenCalledWith(
        [
            recordEqualTo(
                new Group({
                    id: 1,
                    name: 'Management',
                    owner: { id: 1, name: 'Bobby', groupId: 1 },
                })
            ),
            recordEqualTo(
                new Group({ id: 2, name: 'Customers', owner: { id: 1, name: 'Bobby', groupId: 1 } })
            ),
        ],
        [
            recordEqualTo(
                new Group({
                    id: 1,
                    name: 'Management',
                    owner: { id: 1, name: 'Baz', groupId: 1 },
                })
            ),
            recordEqualTo(
                new Group({ id: 2, name: 'Customer', owner: { id: 1, name: 'Baz', groupId: 1 } })
            ),
        ]
    );
    expect(groupListenerSimple).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledWith(
        [
            recordEqualTo(new Group({ id: 1, name: 'Management', ownerId: 1 })),
            recordEqualTo(new Group({ id: 2, name: 'Customers', ownerId: 1 })),
        ],
        [
            recordEqualTo(new Group({ id: 1, name: 'Management', ownerId: 1 })),
            recordEqualTo(new Group({ id: 2, name: 'Customer', ownerId: 1 })),
        ]
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);

    resetCbs();
    unsubFns.forEach(unsub => unsub());
    Subscription.cache.addList([
        {
            id: 1,
            user: {
                id: 1,
                name: 'Bob1',
                group: {
                    id: 1,
                    name: 'Staff1',
                    ownerId: 1,
                },
            },
        },
        {
            id: 2,
            user: {
                id: 1,
                name: 'Bob1',
                group: {
                    id: 1,
                    name: 'Staff1',
                    ownerId: 1,
                },
            },
        },
        {
            id: 3,
            user: {
                id: 2,
                name: 'Sam1',
                group: {
                    id: 2,
                    name: 'Customers1',
                    ownerId: 1,
                },
            },
        },
    ]);
    expect(subscriptionListenerAll).not.toHaveBeenCalled();
    expect(subscriptionListenerNested).not.toHaveBeenCalled();
    expect(subscriptionListenerSimple).not.toHaveBeenCalled();
    expect(userListenerAll).not.toHaveBeenCalled();
    expect(userListenerNested).not.toHaveBeenCalled();
    expect(userListenerSimple).not.toHaveBeenCalled();
    expect(groupListenerSimple).not.toHaveBeenCalled();
    expect(groupListenerAll).not.toHaveBeenCalled();
    expect(groupListenerNested).not.toHaveBeenCalled();
});

test('should support manual batching', async () => {
    const { User } = createTestModels(true);
    await User.fields.group.resolveViewModel();
    const listener = jest.fn();
    const listenerList = jest.fn();
    const listenerAll = jest.fn();
    User.cache.addListener(listenerAll);
    User.cache.addListener(1, ['id', 'name'], listener);
    User.cache.addListenerList([1, 2], ['id', 'name'], listenerList);
    User.cache.batch(() => {
        User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
        User.cache.add({ id: 2, name: 'Sam', groupId: null });
        User.cache.add({ id: 1, name: 'Bobby', groupId: 1 });
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listenerList).toHaveBeenCalledTimes(1);
    expect(listenerAll).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(null, recordEqualTo(new User({ id: 1, name: 'Bobby' })));
    expect(listenerList).toHaveBeenCalledWith(
        [null, null],
        [
            recordEqualTo(new User({ id: 1, name: 'Bobby' })),
            recordEqualTo(new User({ id: 2, name: 'Sam' })),
        ]
    );
});

test('should support manual nested batching', async () => {
    const { User } = createTestModels(true);
    await User.fields.group.resolveViewModel();
    const listener = jest.fn();
    const listenerList = jest.fn();
    const listenerAll = jest.fn();
    User.cache.addListener(listenerAll);
    User.cache.addListener(1, ['id', 'name'], listener);
    User.cache.addListenerList([1, 2], ['id', 'name'], listenerList);
    User.cache.batch(() => {
        User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
        User.cache.batch(() => {
            User.cache.add({ id: 2, name: 'Sam', groupId: null });
            User.cache.add({ id: 1, name: 'Bobby', groupId: 1 });
        });
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listenerList).toHaveBeenCalledTimes(1);
    expect(listenerAll).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(null, recordEqualTo(new User({ id: 1, name: 'Bobby' })));
    expect(listenerList).toHaveBeenCalledWith(
        [null, null],
        [
            recordEqualTo(new User({ id: 1, name: 'Bobby' })),
            recordEqualTo(new User({ id: 2, name: 'Sam' })),
        ]
    );
});

test('many fields should work with empty list of ids', async () => {
    const { User } = createTestModels(true, true);
    await User.fields.group.resolveViewModel();

    const cb = jest.fn();
    User.cache.addListener(1, ['id', 'name', 'groupId', 'group'], cb);

    User.cache.add({
        id: 1,
        name: 'Bob',
        groupId: [],
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(
        null,
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                groupId: [],
                group: [],
            })
        )
    );
    cb.mockReset();

    User.cache.add({
        id: 1,
        name: 'Bobby',
        groupId: [],
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                groupId: [],
                group: [],
            })
        ),
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bobby',
                groupId: [],
                group: [],
            })
        )
    );
});

test('listeners should work across related models (many)', async () => {
    const { User, Group } = createTestModels(true, true);
    await User.fields.group.resolveViewModel();
    const userListenerSimple = jest.fn();
    const userListenerNested = jest.fn();
    const userListenerAll = jest.fn();
    const groupListenerSimple = jest.fn();
    const groupListenerNested = jest.fn();
    const groupListenerAll = jest.fn();
    const listeners = [
        userListenerAll,
        userListenerNested,
        userListenerSimple,
        groupListenerSimple,
        groupListenerAll,
        groupListenerNested,
    ];
    const resetCbs = (): void => {
        listeners.forEach(cb => {
            cb.mockReset();
        });
    };
    const unsubFns = [
        User.cache.addListener(1, ['id', 'name'], userListenerSimple),
        User.cache.addListener(1, ['id', 'name', 'group'], userListenerNested),
        User.cache.addListener(userListenerAll),
        Group.cache.addListener(2, ['id', 'name', 'ownerId'], groupListenerSimple),
        Group.cache.addListener(2, ['id', 'name', 'owner'], groupListenerNested),
        Group.cache.addListener(groupListenerAll),
    ];
    User.cache.add({
        id: 1,
        name: 'Bob',
        group: [
            {
                id: 2,
                name: 'Staff',
                ownerId: 1,
            },
            {
                id: 3,
                name: 'Admins',
                ownerId: 1,
            },
        ],
    });
    expect(userListenerAll).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledWith(
        null,
        recordEqualTo(new User({ id: 1, name: 'Bob' }))
    );
    expect(userListenerNested).toHaveBeenCalledTimes(1);
    expect(userListenerNested).toHaveBeenLastCalledWith(
        null,
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                group: [
                    { id: 2, name: 'Staff', ownerId: 1 },
                    {
                        id: 3,
                        name: 'Admins',
                        ownerId: 1,
                    },
                ],
            })
        )
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledWith(
        null,
        recordEqualTo(new Group({ id: 2, name: 'Staff', ownerId: 1 }))
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        null,
        recordEqualTo(
            new Group({ id: 2, name: 'Staff', owner: { id: 1, name: 'Bob', groupId: [2, 3] } })
        )
    );
    resetCbs();

    Group.cache.add({
        id: 2,
        name: 'Management',
        ownerId: 1,
    });
    expect(userListenerAll).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledTimes(0);
    expect(userListenerNested).toHaveBeenCalledTimes(1);
    expect(userListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                group: [
                    { id: 2, name: 'Staff', ownerId: 1 },
                    { id: 3, name: 'Admins', ownerId: 1 },
                ],
            })
        ),
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                group: [
                    { id: 2, name: 'Management', ownerId: 1 },
                    { id: 3, name: 'Admins', ownerId: 1 },
                ],
            })
        )
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledWith(
        recordEqualTo(new Group({ id: 2, name: 'Staff', ownerId: 1 })),
        recordEqualTo(new Group({ id: 2, name: 'Management', ownerId: 1 }))
    );
    expect(groupListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Group({ id: 2, name: 'Staff', owner: { id: 1, name: 'Bob', groupId: [2, 3] } })
        ),
        recordEqualTo(
            new Group({ id: 2, name: 'Management', owner: { id: 1, name: 'Bob', groupId: [2, 3] } })
        )
    );
    resetCbs();
    User.cache.add({
        id: 1,
        name: 'Bobby',
        groupId: [2],
    });
    expect(groupListenerNested).toHaveBeenCalledWith(
        recordEqualTo(
            new Group({ id: 2, name: 'Management', owner: { id: 1, name: 'Bob', groupId: [2, 3] } })
        ),
        recordEqualTo(
            new Group({ id: 2, name: 'Management', owner: { id: 1, name: 'Bobby', groupId: [2] } })
        )
    );
    expect(groupListenerAll).toHaveBeenCalledTimes(1);
    expect(groupListenerSimple).toHaveBeenCalledTimes(0);

    resetCbs();

    unsubFns.forEach(unsub => unsub());

    User.cache.add({
        id: 1,
        name: 'Bob',
        group: [
            {
                id: 2,
                name: 'Staff',
                ownerId: 1,
            },
        ],
    });
    listeners.forEach(listener => {
        expect(listener).not.toHaveBeenCalled();
    });
});

test.each([
    // There's different ways the required records could end up in the cache. They
    // could be added Group first then User, User first then Group or inline in User
    // (User links to multiple groups - so it has the id's set but the Group records
    // themselves can get added in different ways)
    [
        'group added before',
        ({ User, Group }): void => {
            Group.cache.addList([
                {
                    id: 2,
                    name: 'Staff',
                    ownerId: 1,
                },
                {
                    id: 3,
                    name: 'Admins',
                    // Has no ownerId so not same fields as Staff
                },
            ]);
            User.cache.add({
                id: 1,
                name: 'Bob',
                groupId: [2, 3],
            });
        },
    ],
    [
        'group added after',
        ({ User, Group }): void => {
            User.cache.add({
                id: 1,
                name: 'Bob',
                groupId: [2, 3],
            });
            Group.cache.addList([
                {
                    id: 2,
                    name: 'Staff',
                    ownerId: 1,
                },
                {
                    id: 3,
                    name: 'Admins',
                    // Has no ownerId so not same fields as Staff
                },
            ]);
        },
    ],
    [
        'group added inline',
        ({ User, Group }): void => {
            User.cache.add({
                id: 1,
                name: 'Bob',
                group: [
                    {
                        id: 2,
                        name: 'Staff',
                        ownerId: 1,
                    },
                    {
                        id: 3,
                        name: 'Admins',
                        // Has no ownerId so not same fields as Staff
                    },
                ],
            });
        },
    ],
])('should handle missing records for many fields [%s]', async (label, cacheRecords) => {
    const { User, Group } = createTestModels(true, true);
    await User.fields.group.resolveViewModel();
    const userListenerSimple = jest.fn();
    const userListenerNestedFull = jest.fn();
    const userListenerNestedName = jest.fn();
    User.cache.addListener(1, ['id', 'name'], userListenerSimple);
    User.cache.addListener(1, ['id', 'name', 'group'], userListenerNestedFull);
    User.cache.addListener(1, ['id', 'name', ['group', 'name']], userListenerNestedName);
    cacheRecords({ User, Group });
    expect(userListenerSimple).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledWith(
        null,
        recordEqualTo(new User({ id: 1, name: 'Bob' }))
    );
    expect(userListenerNestedName).toHaveBeenCalledTimes(1);
    expect(userListenerNestedName).toHaveBeenCalledWith(
        null,
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                group: [
                    { id: 2, name: 'Staff' },
                    { id: 3, name: 'Admins' },
                ],
            })
        )
    );
    expect(userListenerNestedFull).not.toHaveBeenCalled();
    expect(User.cache.get(1, ['id', 'name', 'group'])).toBeNull();
    expect(User.cache.get(1, ['id', 'name', 'groupId'])).toBeEqualToRecord(
        new User({
            id: 1,
            name: 'Bob',
            groupId: [2, 3],
        })
    );
    userListenerSimple.mockReset();
    userListenerNestedName.mockReset();
    // If we add the missing field then userListenerNestedFull should be called
    if (label === 'group added inline') {
        // For inline nested records if the fields aren't the same then the intersection is used
        // and so in this example `ownerId` won't be set anywhere for Staff - we need to add it
        // again now.
        Group.cache.addList([
            {
                id: 2,
                name: 'Staff',
                ownerId: 1,
            },
            {
                id: 3,
                name: 'Admins',
                ownerId: 1,
            },
        ]);
    } else {
        Group.cache.add({
            id: 3,
            name: 'Admins',
            ownerId: 1,
        });
    }
    expect(userListenerSimple).not.toHaveBeenCalled();
    expect(userListenerNestedName).not.toHaveBeenCalled();
    expect(userListenerNestedFull).toHaveBeenCalledWith(
        null,
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                group: [
                    { id: 2, name: 'Staff', ownerId: 1 },
                    { id: 3, name: 'Admins', ownerId: 1 },
                ],
            })
        )
    );
});

test.each([
    // There's different ways the required records could end up in the cache. They
    // could be added Group first then User, User first then Group or inline in User
    // (User links to a groups- so it has the id set but the Group record itself can
    // get added in different ways)
    [
        'group added before',
        ({ User, Group }): void => {
            Group.cache.add({
                id: 2,
                name: 'Staff',
            });
            User.cache.add({
                id: 1,
                name: 'Bob',
                groupId: 2,
            });
        },
    ],
    [
        'group added after',
        ({ User, Group }): void => {
            User.cache.add({
                id: 1,
                name: 'Bob',
                groupId: 2,
            });
            Group.cache.add({
                id: 2,
                name: 'Staff',
            });
        },
    ],
    [
        'group added inline',
        ({ User, Group }): void => {
            User.cache.add({
                id: 1,
                name: 'Bob',
                group: {
                    id: 2,
                    name: 'Staff',
                },
            });
        },
    ],
])('should handle missing records for related fields [%s]', async (label, cacheRecords) => {
    const { User, Group } = createTestModels(true);
    await User.fields.group.resolveViewModel();
    const userListenerSimple = jest.fn();
    const userListenerNestedFull = jest.fn();
    const userListenerNestedName = jest.fn();
    User.cache.addListener(1, ['id', 'name'], userListenerSimple);
    User.cache.addListener(1, ['id', 'name', 'group'], userListenerNestedFull);
    User.cache.addListener(1, ['id', 'name', ['group', 'name']], userListenerNestedName);
    cacheRecords({ User, Group });
    expect(userListenerSimple).toHaveBeenCalledTimes(1);
    expect(userListenerSimple).toHaveBeenCalledWith(
        null,
        recordEqualTo(new User({ id: 1, name: 'Bob' }))
    );
    expect(userListenerNestedName).toHaveBeenCalledTimes(1);
    expect(userListenerNestedName).toHaveBeenCalledWith(
        null,
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                group: { id: 2, name: 'Staff' },
            })
        )
    );
    expect(userListenerNestedFull).not.toHaveBeenCalled();
    expect(User.cache.get(1, ['id', 'name', 'group'])).toBeNull();
    expect(User.cache.get(1, ['id', 'name', 'groupId'])).toBeEqualToRecord(
        new User({
            id: 1,
            name: 'Bob',
            groupId: 2,
        })
    );
    userListenerSimple.mockReset();
    userListenerNestedName.mockReset();
    // If we add the missing field then userListenerNestedFull should be called
    Group.cache.add({
        id: 2,
        name: 'Staff',
        ownerId: 1,
    });
    expect(userListenerSimple).not.toHaveBeenCalled();
    expect(userListenerNestedName).not.toHaveBeenCalled();
    expect(userListenerNestedFull).toHaveBeenCalledWith(
        null,
        recordEqualTo(
            new User({
                id: 1,
                name: 'Bob',
                group: { id: 2, name: 'Staff', ownerId: 1 },
            })
        )
    );
});

function timeBlock(run): bigint {
    const start = process.hrtime.bigint();
    run();
    const end = process.hrtime.bigint();
    return (end - start) / BigInt(1e6);
}

test('should be performant', async () => {
    // TODO: I don't know what's good here but as a starting point:
    // 50 nested records (so 50 subs, 50 users, 50, groups) with
    // a listener each (3 on different permutations of nested fields = 250)
    // and list listener on all subscriptions for 3 different permutations of
    // nested fields (150)
    // So total 150 records and 400 listeners
    const { User, Group, Subscription } = createTestModels(true);
    await Subscription.fields.user.resolveViewModel();
    await User.fields.group.resolveViewModel();
    const cbs: jest.Mock[] = [];
    function nextFn(): jest.Mock {
        const fn = jest.fn();
        cbs.push(fn);
        return fn;
    }
    const count = 50;
    for (let i = 0; i < count; i++) {
        Subscription.cache.addListener(i, ['id', 'userId'], nextFn());
        Subscription.cache.addListener(
            i,
            [
                'id',
                ['user', 'name'],
                ['user', 'group', 'name'],
                ['user', 'group', 'owner', 'name'],
            ] as FieldPath<typeof Subscription>[],
            nextFn()
        );
        Subscription.cache.addListener(
            i,
            ['id', ['user', 'group', 'name'], ['user', 'group', 'owner', 'groupId']] as FieldPath<
                typeof Subscription
            >[],
            nextFn()
        );
        Subscription.cache.addListener(
            i,
            [
                'id',
                ['user', 'name'],
                ['user', 'group', 'name'],
                ['user', 'group', 'owner', 'group'],
            ] as FieldPath<typeof Subscription>[],
            nextFn()
        );
        User.cache.addListener(i, ['id', 'name'], nextFn());
        User.cache.addListener(i, ['id', 'name', 'group'], nextFn());
        Group.cache.addListener(i, ['id', 'name', 'ownerId'], nextFn());
        Group.cache.addListener(i, ['id', 'name', 'owner'], nextFn());
    }
    const ids = Array.from({ length: count }, (_, i) => i);
    Subscription.cache.addListenerList(
        ids,
        // Explicit cast as recursive relations not supported by types
        [
            'id',
            ['user', 'name'],
            ['user', 'group', 'name'],
            ['user', 'group', 'owner', 'name'],
        ] as FieldPath<typeof Subscription>[],
        jest.fn()
    );
    Subscription.cache.addListenerList(
        ids,
        ['id', ['user', 'group', 'name'], ['user', 'group', 'owner', 'groupId']] as FieldPath<
            typeof Subscription
        >[],
        jest.fn()
    );
    Subscription.cache.addListenerList(
        ids,
        [
            'id',
            ['user', 'name'],
            ['user', 'group', 'name'],
            ['user', 'group', 'owner', 'group'],
        ] as FieldPath<typeof Subscription>[],
        jest.fn()
    );
    User.cache.addListener(jest.fn());
    Subscription.cache.addListener(jest.fn());
    Group.cache.addListener(jest.fn());
    expect(
        timeBlock(() => {
            for (let i = 0; i < count; i++) {
                Group.cache.add({
                    id: i,
                    name: 'Staff',
                    ownerId: i,
                });
                User.cache.add({
                    id: i,
                    name: 'Bob',
                    groupId: i,
                });
                Subscription.cache.add({
                    id: i,
                    userId: i,
                });
            }
            for (let i = 0; i < count; i++) {
                Subscription.cache.delete(i);
                User.cache.delete(i);
                Group.cache.delete(i);
            }
        })
    ).toBeLessThan(1500);
    for (const cb of cbs) {
        expect(cb).toHaveBeenCalledTimes(2);
    }
});

test('nested cache updates should handle null values being filled out', () => {
    class Business extends viewModelFactory(
        {
            id: new Field(),
            title: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    class Customer extends viewModelFactory(
        {
            id: new Field(),
            businessId: new Field(),
            business: new RelatedViewModelField({ to: Business, sourceFieldName: 'businessId' }),
        },
        { pkFieldName: 'id' }
    ) {}

    class Supplier extends viewModelFactory(
        {
            id: new Field(),
            title: new Field(),
            businessId: new Field(),
            business: new RelatedViewModelField({ to: Business, sourceFieldName: 'businessId' }),
        },
        { pkFieldName: 'id' }
    ) {}

    class Booking extends viewModelFactory(
        {
            id: new Field(),
            customerId: new Field(),
            customer: new RelatedViewModelField({ to: Customer, sourceFieldName: 'customerId' }),
            supplierIds: new ListField({ childField: new Field() }),
            suppliers: new ManyRelatedViewModelField({
                to: Supplier,
                sourceFieldName: 'supplierIds',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    expect(Booking.cache.get(1, '*')).toBe(null);
    Booking.cache.add({
        id: 1,
        customer: null,
        customerId: null,
        supplierIds: [],
        suppliers: [],
    });

    expect(Booking.cache.get(1, '*')).toBeEqualToRecord(
        new Booking({
            id: 1,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            customer: null,
            supplierIds: [],
            suppliers: [],
        })
    );

    Booking.cache.add({
        id: 1,
        customer: {
            id: 1,
            business: null,
        },
        supplierIds: [],
    });
    expect(Booking.cache.get(1, '*')).toBeEqualToRecord(
        new Booking({
            id: 1,
            customer: {
                id: 1,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                business: null,
                businessId: null,
            },
            supplierIds: [],
            suppliers: [],
        })
    );

    Booking.cache.add({
        id: 1,
        customer: {
            id: 1,
            businessId: 1,
            business: {
                id: 1,
                title: 'Business',
            },
        },
        supplierIds: [],
        suppliers: [],
    });

    expect(Booking.cache.get(1, '*')).toBeEqualToRecord(
        new Booking({
            id: 1,
            customer: {
                id: 1,
                business: {
                    id: 1,
                    title: 'Business',
                },
            },
            supplierIds: [],
            suppliers: [],
        })
    );

    Booking.cache.add({
        id: 1,
        customer: {
            id: 1,
            businessId: 1,
            business: {
                id: 1,
                title: 'Business',
            },
        },
        suppliers: [
            {
                id: 1,
                title: 'Supplier1',
                businessId: null,
            },
            {
                id: 2,
                title: 'Supplier2',
                businessId: null,
            },
        ],
    });

    expect(Booking.cache.get(1, '*')).toBeEqualToRecord(
        new Booking({
            id: 1,
            customer: {
                id: 1,
                business: {
                    id: 1,
                    title: 'Business',
                },
            },
            supplierIds: [1, 2],
            suppliers: [
                {
                    id: 1,
                    title: 'Supplier1',
                    businessId: null,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    business: null,
                },
                {
                    id: 2,
                    title: 'Supplier2',
                    businessId: null,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    business: null,
                },
            ],
        })
    );

    Booking.cache.add({
        id: 1,
        customer: {
            id: 1,
            businessId: 1,
            business: {
                id: 1,
                title: 'Business',
            },
        },
        suppliers: [
            {
                id: 1,
                title: 'Supplier1',
                business: {
                    id: 2,
                    title: 'Business2',
                },
            },
            {
                id: 2,
                title: 'Supplier2',
                business: {
                    id: 3,
                    title: 'Business3',
                },
            },
        ],
    });

    expect(Booking.cache.get(1, '*')).toBeEqualToRecord(
        new Booking({
            id: 1,
            customer: {
                id: 1,
                business: {
                    id: 1,
                    title: 'Business',
                },
            },
            supplierIds: [1, 2],
            suppliers: [
                {
                    id: 1,
                    title: 'Supplier1',
                    business: {
                        id: 2,
                        title: 'Business2',
                    },
                },
                {
                    id: 2,
                    title: 'Supplier2',
                    business: {
                        id: 3,
                        title: 'Business3',
                    },
                },
            ],
        })
    );
});

test('cache should handle many related with some null values', () => {
    // This test case handles edge cases around Many fields where some null values for nested relations
    // on only some of the records could cause issues
    class Owner extends viewModelFactory(
        {
            id: new Field(),
            title: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    class Business extends viewModelFactory(
        {
            id: new Field(),
            title: new Field(),
            ownerId: new Field(),
            owner: new RelatedViewModelField({
                to: Owner,
                sourceFieldName: 'ownerId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    class Supplier extends viewModelFactory(
        {
            id: new Field(),
            title: new Field(),
            businessId: new Field(),
            business: new RelatedViewModelField({ to: Business, sourceFieldName: 'businessId' }),
            parentId: new Field(),
            parent: new RelatedViewModelField<any>({
                to: (): any => Supplier,
                sourceFieldName: 'parentId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    class Booking extends viewModelFactory(
        {
            id: new Field(),
            supplierIds: new ListField({ childField: new Field() }),
            suppliers: new ManyRelatedViewModelField({
                to: Supplier,
                sourceFieldName: 'supplierIds',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    Booking.cache.add({
        id: 1,
        suppliers: [
            {
                id: 1,
                title: 'Supplier 1',
                businessId: null,
                business: null,
                parentId: 2,
            },
            {
                id: 2,
                title: 'Supplier 2',
                businessId: null,
                business: null,
                parentId: null,
            },
        ],
    });

    let booking = Booking.cache.get(1, '*');
    expect(booking).not.toBeNull();
    if (booking) {
        expect(booking.suppliers[0].business).toBe(null);
        expect(booking.suppliers[1].business).toBe(null);
        expect(booking.suppliers[1].parent).toBe(null);
        expect(booking.suppliers[0].parent).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Supplier 2',
                businessId: null,
                business: null,
                parentId: null,
            })
        );
    }
    Booking.cache.add({
        id: 2,
        suppliers: [
            {
                id: 1,
                title: 'Supplier 1',
                business: null,
                parentId: null,
            },
            {
                id: 2,
                title: 'Supplier 2',
                business: {
                    id: 1,
                    title: 'Business',
                    owner: {
                        id: 1,
                        title: 'Yes',
                    },
                },
                parentId: null,
            },
        ],
    });
    booking = Booking.cache.get(2, '*');
    expect(booking).not.toBeNull();
    if (booking) {
        expect(booking.suppliers[0].business).toBe(null);
        expect(booking.suppliers[1].business).toEqual(
            recordEqualTo({
                id: 1,
                title: 'Business',
                ownerId: 1,
                owner: {
                    id: 1,
                    title: 'Yes',
                },
            })
        );
        expect(booking.suppliers[1].parent).toBe(null);
        expect(booking.suppliers[0].parent).toBe(null);
    }

    // Same as above but the suppliers are in reverse order
    Booking.cache.add({
        id: 3,
        suppliers: [
            {
                id: 3,
                title: 'Supplier 2',
                business: {
                    id: 2,
                    title: 'Business',
                    owner: {
                        id: 2,
                        title: 'Yes',
                    },
                },
                parentId: null,
            },
            {
                id: 4,
                title: 'Supplier 1',
                business: null,
                businessId: null,
                parentId: null,
            },
        ],
    });
    booking = Booking.cache.get(3, '*');
    expect(booking).not.toBeNull();
    if (booking) {
        expect(booking.suppliers[1].business).toBe(null);
        expect(booking.suppliers[0].business).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Business',
                ownerId: 2,
                owner: {
                    id: 2,
                    title: 'Yes',
                },
            })
        );
        expect(booking.suppliers[0].parent).toBe(null);
        expect(booking.suppliers[1].parent).toBe(null);
    }
});

test('changes to nested records should reflect in parent record', () => {
    class Owner extends viewModelFactory(
        {
            id: new Field(),
            title: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}

    class Supplier extends viewModelFactory(
        {
            id: new Field(),
            title: new Field(),
            ownerId: new Field(),
            owner: new RelatedViewModelField({
                to: Owner,
                sourceFieldName: 'ownerId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    class Business extends viewModelFactory(
        {
            id: new Field(),
            primarySupplierId: new Field(),
            primarySupplier: new RelatedViewModelField({
                to: Supplier,
                sourceFieldName: 'primarySupplierId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    class Booking extends viewModelFactory(
        {
            id: new Field(),
            supplierIds: new ListField({ childField: new Field() }),
            suppliers: new ManyRelatedViewModelField({
                to: Supplier,
                sourceFieldName: 'supplierIds',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    Booking.cache.add({
        id: 1,
        suppliers: [
            {
                id: 1,
                title: 'Supplier 1',
                owner: null,
            },
            {
                id: 2,
                title: 'Supplier 2',
                owner: {
                    id: 1,
                    title: 'Owner 1',
                },
            },
        ],
    });

    Business.cache.add({ id: 1, primarySupplierId: 2 });

    let booking = Booking.cache.get(1, '*');
    expect(booking).not.toBeNull();
    if (booking) {
        expect(booking.suppliers[1]).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Supplier 2',
                owner: {
                    id: 1,
                    title: 'Owner 1',
                },
            })
        );
    }
    let business = Business.cache.get(1, '*');
    expect(business).not.toBeNull();
    if (business) {
        expect(business.primarySupplier).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Supplier 2',
                owner: {
                    id: 1,
                    title: 'Owner 1',
                },
            })
        );
    }

    let supplier = Supplier.cache.get(2, '*');
    expect(supplier).not.toBeNull();
    if (supplier) {
        expect(supplier.owner).toEqual(
            recordEqualTo({
                id: 1,
                title: 'Owner 1',
            })
        );
    }

    Owner.cache.add({
        id: 1,
        title: 'Owner One',
    });
    booking = Booking.cache.get(1, '*');
    expect(booking).not.toBeNull();
    if (booking) {
        expect(booking.suppliers[1]).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Supplier 2',
                owner: {
                    id: 1,
                    title: 'Owner One',
                },
            })
        );
    }

    business = Business.cache.get(1, '*');
    expect(business).not.toBeNull();
    if (business) {
        expect(business.primarySupplier).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Supplier 2',
                owner: {
                    id: 1,
                    title: 'Owner One',
                },
            })
        );
    }

    supplier = Supplier.cache.get(2, '*');
    expect(supplier).not.toBeNull();
    if (supplier) {
        expect(supplier.owner).toEqual(
            recordEqualTo({
                id: 1,
                title: 'Owner One',
            })
        );
    }
});

test('changes to nested records should reflect in parent record with recursive relationships', () => {
    // As above but handle a recursive relationship
    class Supplier extends viewModelFactory(
        {
            id: new Field(),
            title: new Field(),
            parentId: new Field(),
            parent: new RelatedViewModelField<any>({
                to: (): any => Supplier,
                sourceFieldName: 'parentId',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    class Booking extends viewModelFactory(
        {
            id: new Field(),
            supplierIds: new ListField({ childField: new Field() }),
            suppliers: new ManyRelatedViewModelField({
                to: Supplier,
                sourceFieldName: 'supplierIds',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    Booking.cache.add({
        id: 1,
        suppliers: [
            {
                id: 1,
                title: 'Supplier 1',
                parentId: 2,
            },
            {
                id: 2,
                title: 'Supplier 2',
                parentId: null,
            },
        ],
    });

    let booking = Booking.cache.get(1, '*');
    expect(booking).not.toBeNull();
    if (booking) {
        expect(booking.suppliers[1].parent).toBe(null);
        expect(booking.suppliers[0].parent).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Supplier 2',
                parentId: null,
            })
        );
    }

    let supplier = Supplier.cache.get(1, '*');
    expect(supplier).not.toBeNull();
    if (supplier) {
        expect(supplier.parent).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Supplier 2',
                parentId: null,
            })
        );
    }

    Supplier.cache.add({
        id: 2,
        title: 'Supplier Two',
        parentId: null,
    });

    booking = Booking.cache.get(1, '*');
    expect(booking).not.toBeNull();
    if (booking) {
        expect(booking.suppliers[1].parent).toBe(null);
        expect(booking.suppliers[0].parent).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Supplier Two',
                parentId: null,
            })
        );
    }

    supplier = Supplier.cache.get(1, '*');
    expect(supplier).not.toBeNull();
    if (supplier) {
        expect(supplier.parent).toEqual(
            recordEqualTo({
                id: 2,
                title: 'Supplier Two',
                parentId: null,
            })
        );
    }
});

test('nested empty many related fields should match *', () => {
    class RemovalistQuoteSpecialItem extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    class RemovalistQuoteInterimStop extends viewModelFactory(
        {
            id: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    class RemovalistQuote extends viewModelFactory(
        {
            id: new Field(),
            specialItemIds: new ListField({ childField: new IntegerField() }),
            specialItems: new ManyRelatedViewModelField({
                to: RemovalistQuoteSpecialItem,
                sourceFieldName: 'specialItemIds',
            }),
            interimStopIds: new ListField({ childField: new IntegerField() }),
            interimStops: new ManyRelatedViewModelField({
                to: RemovalistQuoteInterimStop,
                sourceFieldName: 'interimStopIds',
            }),
        },
        { pkFieldName: 'id' }
    ) {}
    class Booking extends viewModelFactory(
        {
            id: new Field(),
            removalistQuoteIds: new ListField({ childField: new IntegerField() }),
            removalistQuotes: new ManyRelatedViewModelField({
                to: RemovalistQuote,
                sourceFieldName: 'removalistQuoteIds',
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    const data = {
        id: 1,
        removalistQuoteIds: [1, 2],
        removalistQuotes: [
            {
                id: 1,
                interimStopIds: [1],
                interimStops: [{ id: 1 }],
                specialItemIds: [],
                specialItems: [],
            },
            {
                id: 2,
                interimStops: [],
                interimStopIds: [],
                specialItemIds: [],
                specialItems: [],
            },
        ],
    };

    Booking.cache.add(data);
    expect(Booking.cache.get(1, '*')?.toJS()).toEqual({
        id: 1,
        removalistQuoteIds: [1, 2],
        removalistQuotes: [
            {
                id: 1,
                specialItemIds: [],
                specialItems: [],
                interimStopIds: [1],
                interimStops: [{ id: 1 }],
            },
            {
                id: 2,
                specialItemIds: [],
                // Previous bug results in this value being omitted
                specialItems: [],
                interimStopIds: [],
                interimStops: [],
            },
        ],
    });
});

test('should support removing all records from cache', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field(),
            firstName: new Field(),
            email: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    Test1.cache.add(new Test1({ id: 2, firstName: 'Bob' }));
    Test1.cache.add(new Test1({ id: 2, email: 'bob@b.com' }));
    Test1.cache.add(new Test1({ id: 3, firstName: 'Jack' }));
    expect(Test1.cache.get(2, ['id', 'firstName'])).toBeEqualToRecord(
        new Test1({ id: 2, firstName: 'Bob' })
    );

    const firstNameListener = jest.fn();
    Test1.cache.addListener(2, ['firstName'], firstNameListener);
    const allListener = jest.fn();
    Test1.cache.addListener(allListener);

    Test1.cache.deleteAll(['firstName']);

    expect(firstNameListener).toHaveBeenCalledTimes(1);
    expect(firstNameListener).toHaveBeenLastCalledWith(
        recordEqualTo({
            id: 2,
            firstName: 'Bob',
        }),
        null
    );

    expect(allListener).toHaveBeenCalledTimes(1);

    expect(Test1.cache.get(2, ['id', 'firstName'])).toBeNull();
    expect(Test1.cache.get(3, ['id', 'firstName'])).toBeNull();
    expect(Test1.cache.get(2, ['id', 'email'])).toBeEqualToRecord(
        new Test1({ id: 2, email: 'bob@b.com' })
    );
    Test1.cache.deleteAll();
    expect(allListener).toHaveBeenCalledTimes(2);
    expect(Test1.cache.get(2, ['id', 'email'])).toBeNull();
    expect(Test1.cache.get(3, ['id', 'email'])).toBeNull();
    expect(Test1.cache.getAll(['id'])).toHaveLength(0);
});
