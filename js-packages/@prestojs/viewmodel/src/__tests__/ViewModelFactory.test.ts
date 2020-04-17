/* eslint-disable @typescript-eslint/ban-ts-ignore */
import CharField from '../fields/CharField';
import Field from '../fields/Field';
import NumberField from '../fields/NumberField';
import ViewModelFactory from '../ViewModelFactory';

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

    expect(A.fields.name.parent).toBe(A);
    expect(A.fields.id.parent).toBe(A);

    class B extends A.augment({
        age: new Field(),
    }) {}

    expect(B.fields.name.parent).toBe(B);
    expect(A.fields.name.parent).toBe(A);
    expect(B.fields.age.parent).toBe(B);

    class C extends B {}
    expect(C.fields.name.parent).toBe(C);
    expect(B.fields.name.parent).toBe(B);
    expect(A.fields.name.parent).toBe(A);
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
        class A extends ViewModelFactory(
            {},
            {
                pkFieldName: 'id',
                getImplicitPkField(): [string, Field<any>] {
                    return ['EntityId', new CharField()];
                },
            }
        ) {}
    }).toThrow(/Only one of 'pkFieldName' and 'getImplicitPkField' should be provided/);
});

test('ViewModel should validate primary key fields exist when binding fields', () => {
    // Passing data for fields that don't exist triggers a warning; suppress them for this test
    // eslint-disable-next-line
    const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    class A extends ViewModelFactory({}) {}
    const record1 = new A({ id: 1 });

    expect(record1._pk).toBe(1);

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

test('_pk should return primary key', () => {
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
    }) {}

    const record1 = new A({ id: 1 });
    expect(record1._pk).toBe(1);

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
    expect(record2._pk).toEqual({ id1: 1, id2: 2 });
});

test('should validate primary key is provided', () => {
    class A extends ViewModelFactory({
        id: new Field({ label: 'Id' }),
    }) {}

    expect(() => new A({})).toThrowError("Missing value(s) for primary key(s) 'id'");
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

    expect(() => new A({})).toThrowError("Missing value(s) for primary key(s) 'id1', 'id2'");
    expect(() => new A({ id1: 1 })).toThrowError("Missing value(s) for primary key(s) 'id2'");
    expect(() => new A({ id2: 1 })).toThrowError("Missing value(s) for primary key(s) 'id1'");
    expect(() => new A({ id1: null })).toThrowError(
        "Primary key(s) 'id1' was provided but was null or undefined, Missing value(s) for primary key(s) 'id2'"
    );
    expect(() => new A({ id2: null })).toThrowError(
        "Primary key(s) 'id2' was provided but was null or undefined, Missing value(s) for primary key(s) 'id1'"
    );
    expect(() => new A({ id1: null, id2: null })).toThrowError(
        "Primary key(s) 'id1', 'id2' was provided but was null or undefined"
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
            id: new Field({ label: 'Id' }),
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
    }) {}

    class B extends A.augment({ email: new Field() }) {}

    class C extends B.augment({ phone: new Field() }) {}

    expect(Object.keys(A.fields)).toEqual(['id', 'name']);
    expect(Object.keys(B.fields)).toEqual(['id', 'name', 'email']);
    expect(Object.keys(C.fields)).toEqual(['id', 'name', 'email', 'phone']);

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
