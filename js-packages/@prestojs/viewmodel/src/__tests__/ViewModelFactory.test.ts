/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { getId, isIdentifiable } from '@prestojs/util';
import CharField from '../fields/CharField';
import Field from '../fields/Field';
import NumberField from '../fields/NumberField';
import { RelatedViewModelField } from '../fields/RelatedViewModelField';
import viewModelFactory from '../ViewModelFactory';
import ViewModelFactory, {
    expandRelationFieldPaths,
    flattenFieldPath,
    getAssignedFieldsDeep,
    isViewModelClass,
    isViewModelInstance,
    ViewModelConstructor,
} from '../ViewModelFactory';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R, T> {
            toBeEqualToRecord(received: any, msg?: string): R;
        }
    }
}

test('Should be able to invoke ViewModelFactory directly and explicitly creates a pk without error', () => {
    ViewModelFactory({
        id: new Field(),
    }).fields;
});

test('_model property returns the class', () => {
    class A extends ViewModelFactory({
        id: new Field(),
    }) {}

    class B extends A {}
    const record1 = new A({ id: 1 });

    expect(record1._model).toEqual(A);

    const record2 = new B({ id: 2 });
    expect(record2._model).toEqual(B);
});

test('ViewModelFactory should ensure required properties are specified', () => {
    class Test1 extends ViewModelFactory({
        id: new Field(),
    }) {}
    expect(() => Test1.label).toThrow(/You must define/);
    expect(() => Test1.labelPlural).toThrow(/You must define/);

    class Test2 extends ViewModelFactory({
        id: new Field(),
    }) {
        static label = 'Test';
        static labelPlural = 'Tests';
    }
    expect(Test2.label).toBe('Test');
    expect(Test2.labelPlural).toBe('Tests');
});

test('ViewModel should be accessible via the field', () => {
    class A extends ViewModelFactory({
        id: new Field(),
        name: new Field(),
    }) {}

    expect(A.fields.name.model).toBe(A);
    expect(A.fields.id.model).toBe(A);

    class B extends A.augment({
        age: new Field(),
    }) {}

    expect(B.fields.name.model).toBe(B);
    expect(A.fields.name.model).toBe(A);
    expect(B.fields.age.model).toBe(B);

    class C extends B {}
    expect(C.fields.name.model).toBe(C);
    expect(B.fields.name.model).toBe(B);
    expect(A.fields.name.model).toBe(A);
});

test('field name and label should be set automatically', () => {
    class A extends ViewModelFactory({
        id: new Field(),
        firstName: new Field(),
        LastName: new Field(),
        // eslint-disable-next-line @typescript-eslint/camelcase
        email_address: new Field(),
        CONTACT_NUMBER: new Field(),
        age: new Field({ label: 'User Age' }),
    }) {}
    expect(A.fields.firstName.name).toBe('firstName');
    expect(A.fields.firstName.label).toBe('First Name');
    expect(A.fields.LastName.name).toBe('LastName');
    expect(A.fields.LastName.label).toBe('Last Name');
    expect(A.fields.email_address.name).toBe('email_address');
    expect(A.fields.email_address.label).toBe('Email Address');
    expect(A.fields.CONTACT_NUMBER.name).toBe('CONTACT_NUMBER');
    expect(A.fields.CONTACT_NUMBER.label).toBe('Contact Number');
    expect(A.fields.age.name).toBe('age');
    expect(A.fields.age.label).toBe('User Age');
});

test('should generate pk automatically where possible', () => {
    class A extends ViewModelFactory({}) {}
    expect(A.fields.id).toBeInstanceOf(NumberField);
    expect(A.pkFieldName).toBe('id');

    class B extends ViewModelFactory(
        {},
        {
            getImplicitPkField(): [string, Field<any>] {
                return ['EntityId', new CharField()];
            },
        }
    ) {}

    expect(B.pkFieldName).toBe('EntityId');
    // We can't type dynamic pk field names - will ignore them throughout this method
    // @ts-ignore
    expect(B.fields.EntityId).toBeInstanceOf(CharField);

    class C extends ViewModelFactory(
        {},
        {
            getImplicitPkField(): [string[], Field<any>[]] {
                return [
                    ['model', 'uuid'],
                    [new CharField(), new NumberField()],
                ];
            },
        }
    ) {}
    expect(C.pkFieldName).toEqual(['model', 'uuid']);
    // @ts-ignore
    expect(C.fields.model).toBeInstanceOf(CharField);
    // @ts-ignore
    expect(C.fields.uuid).toBeInstanceOf(NumberField);

    class D extends ViewModelFactory({
        id: new CharField(),
    }) {}
    expect(D.fields.id).toBeInstanceOf(CharField);
    expect(D.pkFieldName).toBe('id');

    class DynamicBase extends ViewModelFactory(
        {},
        {
            getImplicitPkField(model, fields): [string, Field<any>] {
                if ('EntityId' in fields) {
                    // @ts-ignore
                    return ['EntityId', fields.EntityId];
                }
                // Generate a name base on model, eg. `userId`
                const name = model.name[0].toLowerCase() + model.name.slice(1);
                return [`${name}Id`, new NumberField()];
            },
        }
    ) {}

    class User extends DynamicBase {}
    expect(User.pkFieldName).toEqual('userId');
    // @ts-ignore
    expect(User.fields.userId).toBeInstanceOf(NumberField);

    // Multi level inheritance should follow same rules and not inherit implicit
    // keys from parent
    class AdminUser extends User {}
    expect(AdminUser.pkFieldName).toEqual('adminUserId');
    // @ts-ignore
    expect(AdminUser.fields.adminUserId).toBeInstanceOf(NumberField);
    // @ts-ignore
    expect(AdminUser.fields.adminUserId.name).toBe('adminUserId');
    // @ts-ignore
    expect(User.fields.userId.name).toBe('userId');
    expect(User.pkFieldName).toEqual('userId');
    // @ts-ignore
    expect(User.fields.userId).toBeInstanceOf(NumberField);

    // Multi level inheritance should follow same rules and not inherit implicit
    // keys from parent
    class BlogPost extends DynamicBase.augment({ EntityId: new CharField() }) {}
    expect(BlogPost.pkFieldName).toEqual('EntityId');
    expect(BlogPost.fields.EntityId).toBeInstanceOf(CharField);
});

test('should error if pkFieldName and getImplicitPkField provided', () => {
    expect(() => {
        ViewModelFactory(
            {},
            {
                pkFieldName: 'id',
                getImplicitPkField(): [string, Field<any>] {
                    return ['EntityId', new CharField()];
                },
            }
        );
    }).toThrow(/Only one of 'pkFieldName' and 'getImplicitPkField' should be provided/);
});

test('ViewModel should validate primary key fields exist when binding fields', () => {
    // Passing data for fields that don't exist triggers a warning; suppress them for this test
    // eslint-disable-next-line
    const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    class A extends ViewModelFactory({}) {}
    const record1 = new A({ id: 1 });

    expect(record1._key).toBe(1);

    class B extends ViewModelFactory(
        {},
        {
            pkFieldName: ['id1', 'id2'],
        }
    ) {}

    expect(() => B.fields).toThrow(
        /B has 'pkFieldName' set to 'id1, id2' but the field\(s\) 'id1, id2'/
    );

    class C extends ViewModelFactory(
        {
            id1: new Field({ label: 'Id' }),
        },
        {
            pkFieldName: ['id1', 'id2'],
        }
    ) {}

    expect(() => C.fields).toThrow(
        /C has 'pkFieldName' set to 'id1, id2' but the field\(s\) 'id2'/
    );

    mockWarn.mockRestore();
});

test('_key should return primary key', () => {
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
    }) {}

    const record1 = new A({ id: 1 });
    expect(record1._key).toBe(1);

    class B extends ViewModelFactory(
        {
            id1: new Field({ label: 'Id' }),
            id2: new Field({ label: 'Id' }),
        },
        {
            pkFieldName: ['id1', 'id2'],
        }
    ) {}

    const record2 = new B({ id1: 1, id2: 2 });
    expect(record2._key).toEqual({ id1: 1, id2: 2 });
});

test('should validate primary key is provided', () => {
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
    }) {}

    expect(() => new A({})).toThrowError(/Missing value\(s\) for primary key\(s\) 'id'/);
    expect(() => new A({ id: null })).toThrowError(
        "Primary key(s) 'id' was provided but was null or undefined"
    );
});

test('should validate primary keys are provided', () => {
    class A extends ViewModelFactory(
        {
            id1: new Field({ label: 'Id1' }),
            id2: new Field({ label: 'Id2' }),
        },
        {
            pkFieldName: ['id1', 'id2'],
        }
    ) {}

    expect(() => new A({})).toThrowError(/Missing value\(s\) for primary key\(s\) 'id1', 'id2'/);
    expect(() => new A({ id1: 1 })).toThrowError(/Missing value\(s\) for primary key\(s\) 'id2'/);
    expect(() => new A({ id2: 1 })).toThrowError(/Missing value\(s\) for primary key\(s\) 'id1'/);
    expect(() => new A({ id1: null })).toThrowError(
        /Primary key\(s\) 'id1' was provided but was null or undefined, Missing value\(s\) for primary key\(s\) 'id2'/
    );
    expect(() => new A({ id2: null })).toThrowError(
        /Primary key\(s\) 'id2' was provided but was null or undefined, Missing value\(s\) for primary key\(s\) 'id1'/
    );
    expect(() => new A({ id1: null, id2: null })).toThrowError(
        /Primary key\(s\) 'id1', 'id2' was provided but was null or undefined/
    );
});

test('_assignedFields should be based on passed data', () => {
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
        name: new Field({ label: 'Name' }),
        email: new Field({ label: 'Email' }),
    }) {}

    let record = new A({ id: 1 });
    expect(record._assignedFields).toEqual(['id']);

    record = new A({ id: 1, name: 'Dave' });
    expect(record._assignedFields).toEqual(['id', 'name']);
    record = new A({ id: 1, name: 'Dave', email: 'a@b.com' });
    expect(record._assignedFields).toEqual(['email', 'id', 'name']);
});

test('toJS() should be return assigned data', () => {
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
        name: new Field({ label: 'Name' }),
        email: new Field({ label: 'Email' }),
    }) {}

    let record = new A({ id: 1 });
    expect(record.toJS()).toEqual({ id: 1 });

    record = new A({ id: 1, name: 'Dave' });
    expect(record.toJS()).toEqual({ id: 1, name: 'Dave' });
    record = new A({ id: 1, name: 'Dave', email: 'a@b.com' });
    expect(record.toJS()).toEqual({ id: 1, name: 'Dave', email: 'a@b.com' });
});

test('toJS() should support custom field behaviour', () => {
    class LowerField extends Field<string> {
        toJS(value: any): string {
            return value.toString().toLowerCase();
        }
    }
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
        name: new Field({ label: 'Name' }),
        email: new LowerField({ label: 'Email' }),
    }) {}

    const record = new A({ id: 1, name: 'Dave', email: 'A@B.COM' });
    expect(record.toJS()).toEqual({ id: 1, name: 'Dave', email: 'a@b.com' });
});

test('ViewModel should use normalize() from field', () => {
    class LowerField extends Field<string> {
        normalize(value: any): string {
            return value.toString().toLowerCase();
        }
    }
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
        name: new Field({ label: 'Name' }),
        email: new LowerField({ label: 'Email' }),
    }) {}

    const record = new A({ id: 1, name: 'Dave', email: 'A@B.COM' });
    expect(record.email).toBe('a@b.com');
});

test('Should be able to compare if two records are equal', () => {
    class TestDateField extends Field<Date> {
        isEqual(value1: Date, value2: Date): boolean {
            return value1.getTime() === value2.getTime();
        }
    }
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
        name: new Field({ label: 'Name' }),
        email: new Field({ label: 'Email' }),
        createdAt: new TestDateField({ label: 'Created At' }),
    }) {}

    expect(new A({ id: 1 }).isEqual(new A({ id: 1 }))).toBe(true);
    expect(new A({ id: 1 }).isEqual(new A({ id: 1, name: null }))).toBe(false);
    expect(new A({ id: 1, name: null }).isEqual(new A({ id: 1, name: null }))).toBe(true);
    expect(
        new A({ id: 1, createdAt: new Date('2019-11-20 18:30') }).isEqual(
            new A({ id: 1, createdAt: new Date('2019-11-20 18:30') })
        )
    ).toBe(true);
    expect(
        new A({ id: 1, createdAt: new Date('2019-11-20 18:30') }).isEqual(
            new A({ id: 1, createdAt: new Date('2019-11-20 18:31') })
        )
    ).toBe(false);

    class B extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
        name: new Field({ label: 'Name' }),
        email: new Field({ label: 'Email' }),
        createdAt: new TestDateField({ label: 'Created At' }),
    }) {}
    const data = {
        id: 1,
        name: 'John',
        email: 'a@b.com',
    };
    expect(new A(data).isEqual(new B(data))).toBe(false);
    expect(new A(data).isEqual(null)).toBe(false);
    // @ts-ignore
    expect(new A(data).isEqual(1)).toBe(false);
    // @ts-ignore
    expect(new A(data).isEqual('string')).toBe(false);
});

test('Should be able to compare if two nested records are equal', async () => {
    const Group = viewModelFactory({
        name: new Field<string>(),
    });
    const User = viewModelFactory({
        name: new Field<string>(),
        groupId: new Field<number>(),
        group: new RelatedViewModelField({
            to: (): Promise<typeof Group> => Promise.resolve(Group),
            sourceFieldName: 'groupId',
        }),
    });
    const fields = {
        userId: new Field<number>(),
        user: new RelatedViewModelField<typeof User>({
            to: (): Promise<typeof User> => Promise.resolve(User),
            sourceFieldName: 'userId',
        }),
    };
    const Subscription = viewModelFactory(fields);
    await Subscription.fields.user.resolveViewModel();
    const record1 = new Subscription({
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
    const record2 = new Subscription({
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
    const record3 = new Subscription({
        id: 1,
        user: {
            id: 1,
            name: 'Bob',
            group: {
                id: 2,
                name: 'Customer',
            },
        },
    });
    expect(record1.isEqual(record2)).toBe(true);
    expect(record1.isEqual(record3)).toBe(false);
});

test('should clone a ViewModel record', () => {
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
        name: new Field({ label: 'Name' }),
        email: new Field({ label: 'Email' }),
    }) {}

    const record1 = new A({
        id: 1,
        name: 'bob',
        email: 'a@b',
    });
    const cloneFull = record1.clone();
    expect(cloneFull).not.toBe(record1);
    expect(cloneFull._assignedFields).toEqual(['email', 'id', 'name']);
    expect(cloneFull.isEqual(record1)).toBe(true);

    const cloneName = record1.clone(['id', 'name']);
    expect(cloneName._assignedFields).toEqual(['id', 'name']);
    expect(cloneName.toJS()).toEqual({
        id: 1,
        name: 'bob',
    });

    // Don't have to include primary key
    const cloneNameNoExplicitId = record1.clone(['name']);
    expect(cloneNameNoExplicitId._assignedFields).toEqual(['id', 'name']);
    expect(cloneNameNoExplicitId.toJS()).toEqual({
        id: 1,
        name: 'bob',
    });

    // Cloning a partial record should result in a partial record
    const clone2 = cloneName.clone();
    expect(clone2).not.toBe(cloneName);
    expect(clone2._assignedFields).toEqual(['id', 'name']);
    expect(clone2.toJS()).toEqual({
        id: 1,
        name: 'bob',
    });
});

describe('env tests', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
        delete process.env.NODE_ENV;
    });

    afterEach(() => {
        process.env = OLD_ENV;
    });

    test('should error when accessing unfetched fields', () => {
        process.env.NODE_ENV = 'development';
        class A extends ViewModelFactory({
            id: new Field({ label: 'Id' }),
            name: new Field({ label: 'Name' }),
            email: new Field({ label: 'Email' }),
        }) {}
        const record1 = new A({
            id: 1,
            name: 'bob',
            email: 'a@b',
        });
        record1.id;
        record1.name;
        record1.email;
        const record2 = new A({
            id: 1,
            name: 'bob',
        });
        expect(() => record2.email).toThrowError(/not instantiated/);

        process.env.NODE_ENV = 'production';

        // eslint-disable-next-line
        const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
        record2.email;
        expect(mockWarn).toHaveBeenCalledWith(
            "'email' accessed on A but was not instantiated with it. Available fields are: id, name"
        );
    });

    test('should error if attempt to set a field', () => {
        process.env.NODE_ENV = 'development';
        class A extends ViewModelFactory({
            name: new Field({ label: 'Name' }),
            email: new Field({ label: 'Email' }),
        }) {}
        const record1 = new A({
            id: 1,
            name: 'bob',
            email: 'a@b',
        });
        // @ts-ignore
        expect(() => (record1.email = 'test')).toThrowError('email is read only');
        // Make sure auto field is also read only
        // @ts-ignore
        expect(() => (record1.id = 5)).toThrowError('id is read only');

        process.env.NODE_ENV = 'production';

        // @ts-ignore
        record1.email = 'test';

        // eslint-disable-next-line
        const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
        expect(mockWarn).toHaveBeenCalledWith('email is read only');

        expect(record1._data).toEqual({
            id: 1,
            name: 'bob',
            email: 'a@b',
        });

        // This should be frozen, changes should be ignored
        // Note that what exactly happens depends on where it runs - in node it throws
        // an error but in chrome it's just ignored
        // @ts-ignore
        expect(() => (record1._data.name = 'jo')).toThrowError(/read only/);

        expect(record1._data).toEqual({
            id: 1,
            name: 'bob',
            email: 'a@b',
        });
    });
});

test('augmenting should extend the source class', () => {
    class A extends ViewModelFactory({
        id: new Field(),
        name: new Field(),
    }) {
        static label = 'A';
        static labelPlural = 'As';
    }

    class B extends A.augment({ email: new Field() }) {}

    class C extends B.augment({ phone: new Field() }) {
        static label = 'C';
        static labelPlural = 'Cs';
    }

    expect(Object.keys(A.fields)).toEqual(['id', 'name']);
    expect(Object.keys(B.fields)).toEqual(['id', 'name', 'email']);
    expect(Object.keys(C.fields)).toEqual(['id', 'name', 'email', 'phone']);
    expect(A.label).toBe('A');
    expect(A.labelPlural).toBe('As');
    expect(B.label).toBe('A');
    expect(B.labelPlural).toBe('As');
    expect(C.label).toBe('C');
    expect(C.labelPlural).toBe('Cs');

    const record1 = new B({ id: 1 });
    expect(record1).toBeInstanceOf(A);
    expect(record1).toBeInstanceOf(B);
    const record2 = new C({ id: 1 });
    expect(record2).toBeInstanceOf(A);
    expect(record2).toBeInstanceOf(B);
    expect(record2).toBeInstanceOf(C);
});

test('augment should support removing fields', () => {
    class A extends ViewModelFactory({
        id: new Field(),
        name: new Field(),
    }) {}

    class B extends A.augment({ email: new Field(), name: null }) {}

    class C extends B.augment({ phone: new Field(), email: null }) {}

    expect(Object.keys(A.fields)).toEqual(['id', 'name']);
    expect(Object.keys(B.fields)).toEqual(['id', 'email']);
    expect(Object.keys(C.fields)).toEqual(['id', 'phone']);
});

test('augment should support changing options', () => {
    class A extends ViewModelFactory({
        id: new Field(),
        name: new Field(),
    }) {}

    class B extends A.augment(
        { email: new Field(), id: null, uuid: new Field() },
        { pkFieldName: 'uuid' }
    ) {}

    expect(Object.keys(A.fields)).toEqual(['id', 'name']);
    expect(Object.keys(B.fields)).toEqual(['name', 'email', 'uuid']);
});

test('isViewModelInstance should identify ViewModel instances', () => {
    class A extends ViewModelFactory({}) {}
    expect(isViewModelInstance(A)).toBe(false);
    expect(isViewModelInstance(new A({ id: 1 }))).toBe(true);
    expect(isViewModelInstance(null)).toBe(false);

    class B extends A.augment({}) {}
    expect(isViewModelInstance(new B({ id: 1 }))).toBe(true);

    class C extends B {}
    expect(isViewModelInstance(new C({ id: 1 }))).toBe(true);
});

test('isViewModelClass should identify ViewModel classes', () => {
    class A extends ViewModelFactory({}) {}
    expect(isViewModelClass(A)).toBe(true);
    expect(isViewModelClass(new A({ id: 1 }))).toBe(false);
    expect(isViewModelClass(null)).toBe(false);

    class B extends A.augment({}) {}
    expect(isViewModelClass(B)).toBe(true);

    class C extends B {}
    expect(isViewModelClass(C)).toBe(true);
});

test('should disallow naming fields one of reserved names', () => {
    const reservedNames = ['toJS', 'clone', 'isEqual'];
    for (const name of reservedNames) {
        expect(() => {
            ViewModelFactory({
                [name]: new Field(),
            });
        }).toThrow(/is reserved and cannot be used as a field name/);

        expect(() => {
            class A extends ViewModelFactory(
                {},
                {
                    getImplicitPkField(): [string, Field<any>] {
                        return [name, new CharField()];
                    },
                }
            ) {}
            A.pkFieldNames;
        }).toThrow(/is reserved and cannot be used as a field name/);
    }
});

test('should bind fields to _f', () => {
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
        name: new Field({ label: 'Name' }),
        email: new Field({ label: 'Email' }),
    }) {}

    const record1 = new A({
        id: 1,
        name: 'bob',
        email: 'a@b',
    });

    expect(record1._f.name).toBeInstanceOf(Field);
    expect(record1._f.name.value).toBe('bob');
    expect(record1._f.email.value).toBe('a@b');
    expect(record1._f.id.value).toBe(1);
});

test('should conform to Identifiable', () => {
    class Test1 extends ViewModelFactory({
        id: new Field(),
    }) {}

    const record1 = new Test1({ id: 1 });
    const record2 = new Test1({ id: 2 });

    expect(isIdentifiable(record1)).toBe(true);
    expect(isIdentifiable(record2)).toBe(true);
    expect(getId(record1)).toBe(1);
    expect(getId(record2)).toBe(2);
});

test('should support cloning across related fields', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    const Group = viewModelFactory({
        name: new Field<string>(),
    });
    const User = viewModelFactory({
        name: new Field<string>(),
        groupId: new Field<number>(),
        group: new RelatedViewModelField({
            to: (): Promise<typeof Group> => Promise.resolve(Group),
            sourceFieldName: 'groupId',
        }),
    });
    const fields = {
        userId: new Field<number>(),
        user: new RelatedViewModelField<typeof User>({
            to: (): Promise<typeof User> => Promise.resolve(User),
            sourceFieldName: 'userId',
        }),
    };
    const Subscription = viewModelFactory(fields);
    await Subscription.fields.user.resolveViewModel();
    const record1 = new Subscription({
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
    expect(
        new Subscription({
            id: 1,
            user: {
                id: 1,
                name: 'Bob',
            },
        })
    ).toBeEqualToRecord(record1.clone([['user', 'name']]));
    expect(
        new Subscription({
            id: 1,
            user: {
                id: 1,
                name: 'Bob',
                group: {
                    id: 1,
                },
            },
        })
    ).toBeEqualToRecord(
        record1.clone([
            ['user', 'name'],
            ['user', 'group', 'id'],
        ])
    );
    // Shouldn't have been called with eg. 'Received value for key <key>. No such field exist on Subscription'
    expect(mockWarn).not.toHaveBeenCalled();

    const record2 = new Subscription({
        id: 1,
        user: {
            id: 1,
        },
    });

    expect(() =>
        record2.clone([
            ['user', 'name'],
            ['user', 'group', 'id'],
        ])
    ).toThrowError(/Missing fields: user.group, user.name/);
    const record3 = new Subscription({
        id: 1,
        userId: 1,
    });
    expect(() =>
        record3.clone([
            ['user', 'name'],
            ['user', 'group', 'id'],
        ])
    ).toThrowError(/Missing fields: user/);
    const record4 = new Subscription({
        id: 1,
        user: {
            id: 1,
            group: {
                id: 1,
            },
        },
    });
    expect(() => record4.clone([['user', 'group', 'name']])).toThrowError(
        /Missing fields: user.group.name/
    );
});

test('getAssignedFieldsDeep should handle related view model data', async () => {
    const Group = viewModelFactory({
        name: new Field<string>(),
    });
    const User = viewModelFactory({
        name: new Field<string>(),
        groupId: new Field<number>(),
        group: new RelatedViewModelField({
            to: (): Promise<typeof Group> => Promise.resolve(Group),
            sourceFieldName: 'groupId',
        }),
    });
    const fields = {
        userId: new Field<number>(),
        user: new RelatedViewModelField<typeof User>({
            to: (): Promise<typeof User> => Promise.resolve(User),
            sourceFieldName: 'userId',
        }),
    };
    const Subscription = viewModelFactory(fields);
    await Subscription.fields.user.resolveViewModel();
    const record1 = new Subscription({
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
    expect(getAssignedFieldsDeep(record1)).toEqual([
        'id',
        ['user', 'group', 'id'],
        ['user', 'group', 'name'],
        ['user', 'groupId'],
        ['user', 'id'],
        ['user', 'name'],
        'userId',
    ]);
    const record2 = new Subscription({
        id: 1,
        user: {
            id: 1,
            group: {
                id: 1,
            },
        },
    });
    expect(getAssignedFieldsDeep(record2)).toEqual([
        'id',
        ['user', 'group', 'id'],
        ['user', 'groupId'],
        ['user', 'id'],
        'userId',
    ]);
    const record3 = new User({
        id: 1,
        name: 'test',
    });
    expect(getAssignedFieldsDeep(record3)).toEqual(['id', 'name']);
});

test('flattenFieldPath should flatten nested paths', async () => {
    expect(flattenFieldPath(['id', 'name'])).toEqual(['id', 'name']);
    expect(
        flattenFieldPath([
            'id',
            ['user', 'group', 'id'],
            ['user', 'group', 'name'],
            ['user', 'groupId'],
            ['user', 'id'],
            ['user', 'name'],
            'userId',
        ])
    ).toEqual([
        'id',
        'user.group.id',
        'user.group.name',
        'user.groupId',
        'user.id',
        'user.name',
        'userId',
    ]);
    expect(
        flattenFieldPath([
            'id',
            ['user', 'group', 'id'],
            ['user', 'groupId'],
            ['user', 'id'],
            'userId',
        ])
    ).toEqual(['id', 'user.group.id', 'user.groupId', 'user.id', 'userId']);
    expect(
        flattenFieldPath([
            'id',
            ['user', 'group', 'id'],
            ['user', 'group', 'name'],
            ['user', 'group', 'owner', 'name'],
            ['user', 'group', 'owner', 'id'],
            ['user', 'groupId'],
            ['user', 'id'],
            ['user', 'name'],
            'userId',
        ])
    ).toEqual([
        'id',
        'user.group.id',
        'user.group.name',
        'user.group.owner.name',
        'user.group.owner.id',
        'user.groupId',
        'user.id',
        'user.name',
        'userId',
    ]);
});

test('expandPaths should correctly expand paths', async () => {
    const Group = viewModelFactory({
        name: new Field<string>(),
        ownerId: new Field<number>(),
        owner: new RelatedViewModelField({
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            to: (): Promise<typeof User> => Promise.resolve(User),
            sourceFieldName: 'ownerId',
        }),
    });
    const User = viewModelFactory({
        name: new Field<string>(),
        groupId: new Field<number>(),
        group: new RelatedViewModelField({
            to: (): Promise<typeof Group> => Promise.resolve(Group),
            sourceFieldName: 'groupId',
        }),
    });
    const Subscription = viewModelFactory({
        userId: new Field<number>(),
        user: new RelatedViewModelField<typeof User>({
            to: (): Promise<typeof User> => Promise.resolve(User),
            sourceFieldName: 'userId',
        }),
    });
    await Subscription.fields.user.resolveViewModel();
    expect(expandRelationFieldPaths(Subscription, [['user', 'group']])).toEqual([
        'userId',
        ['user', 'groupId'],
        ['user', 'group', 'name'],
        ['user', 'group', 'ownerId'],
    ]);
    expect(expandRelationFieldPaths(Subscription, ['userId', ['user', 'group']])).toEqual([
        'userId',
        ['user', 'groupId'],
        ['user', 'group', 'name'],
        ['user', 'group', 'ownerId'],
    ]);
    expect(expandRelationFieldPaths(User, ['id', 'name', 'group'])).toEqual([
        'id',
        'name',
        'groupId',
        ['group', 'name'],
        ['group', 'ownerId'],
    ]);
    expect(
        expandRelationFieldPaths(User, ['name', ['group', 'name'], ['group', 'owner', 'name']])
    ).toEqual([
        'name',
        'groupId',
        ['group', 'name'],
        ['group', 'ownerId'],
        ['group', 'owner', 'name'],
    ]);
    expect(
        expandRelationFieldPaths(User, [
            'name',
            ['group', 'name'],
            ['group', 'owner', 'name'],
            ['group', 'owner', 'group'],
        ])
    ).toEqual([
        'name',
        'groupId',
        ['group', 'name'],
        ['group', 'ownerId'],
        ['group', 'owner', 'name'],
        ['group', 'owner', 'groupId'],
        ['group', 'owner', 'group', 'name'],
        ['group', 'owner', 'group', 'ownerId'],
    ]);

    // Should handle overlap
    expect(
        expandRelationFieldPaths(User, [
            'name',
            ['group', 'name'],
            ['group', 'ownerId'],
            ['group', 'owner', 'name'],
            // Specify group which means all non-relation fields
            ['group', 'owner', 'group'],
            // Then opt in to a relation as well
            ['group', 'owner', 'group', 'owner'],
        ])
    ).toEqual([
        'name',
        'groupId',
        ['group', 'name'],
        ['group', 'ownerId'],
        ['group', 'owner', 'name'],
        ['group', 'owner', 'groupId'],
        ['group', 'owner', 'group', 'name'],
        ['group', 'owner', 'group', 'ownerId'],
        ['group', 'owner', 'group', 'owner', 'name'],
        ['group', 'owner', 'group', 'owner', 'groupId'],
    ]);
});

test('getField should support traversing relations', async () => {
    class Group extends viewModelFactory({
        name: new Field<string>(),
        ownerId: new Field<number>(),
        owner: new RelatedViewModelField({
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            to: (): Promise<ViewModelConstructor<any>> => Promise.resolve(User),
            sourceFieldName: 'ownerId',
        }),
    }) {}
    class User extends viewModelFactory({
        name: new Field<string>(),
        groupId: new Field<number>(),
        group: new RelatedViewModelField({
            to: (): Promise<typeof Group> => Promise.resolve(Group),
            sourceFieldName: 'groupId',
        }),
    }) {}
    class Subscription extends viewModelFactory({
        userId: new Field<number>(),
        user: new RelatedViewModelField<typeof User>({
            to: (): Promise<typeof User> => Promise.resolve(User),
            sourceFieldName: 'userId',
        }),
    }) {}
    await Subscription.fields.user.resolveViewModel();
    expect(Subscription.getField('user')).toBe(Subscription.fields.user);
    expect(Subscription.getField(['user', 'group'])).toBe(User.fields.group);
    expect(Subscription.getField(['user', 'group', 'owner'])).toBe(Group.fields.owner);

    expect(() => Subscription.getField('asdf')).toThrow(
        new Error("Unknown field 'asdf' on ViewModel 'Subscription'")
    );

    expect(() => Subscription.getField(['user', 'blah', 'id'])).toThrow(
        new Error("Unknown field 'blah' (from [user, blah, id]) on ViewModel 'User'")
    );

    expect(() => Subscription.getField(['user', 'name', 'id'])).toThrow(
        new Error(
            "Field 'name' (from [user, name, id]) on ViewModel 'User' is not a field that extends BaseRelatedViewModelField"
        )
    );
});
