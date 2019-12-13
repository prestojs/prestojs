import CharField from '../fields/CharField';
import NumberField from '../fields/NumberField';
import ViewModel from '../ViewModel';
import Field from '../fields/Field';

test('ViewModel._model returns class', () => {
    class A extends ViewModel {
        static _fields = {
            id: new Field({ label: 'id' }),
        };
    }

    class B extends A {
        static _fields = {
            id: new Field({ label: 'id' }),
        };
    }
    const record1 = new A({ id: 1 });

    expect(record1._model).toEqual(A);

    const record2 = new B({ id: 2 });
    expect(record2._model).toEqual(B);
});

test('ViewModel should be accessible via the field', () => {
    class A extends ViewModel {
        static _fields: Record<string, Field<any>> = {
            id: new Field({ label: 'id' }),
            name: new Field({ label: 'id' }),
        };
    }

    A._fields.email = new Field({ label: 'Name' });
    expect(A.fields.name.parent).toBe(A);
    expect(A.fields.email.parent).toBe(A);

    class B extends A {}

    B._fields = {
        ...B._fields,
        age: new Field({ label: 'Age' }),
    };

    expect(B.fields.name.parent).toBe(B);
    expect(A.fields.name.parent).toBe(A);
    expect(B.fields.age.parent).toBe(B);

    class C extends B {}
    expect(C.fields.name.parent).toBe(C);
    expect(B.fields.name.parent).toBe(B);
    expect(A.fields.name.parent).toBe(A);
});

test('_fields should be unusable after fields bound', () => {
    class A extends ViewModel {
        static _fields: Record<string, Field<any>> = {
            id: new Field({ label: 'id' }),
            name: new Field({ label: 'id' }),
        };
    }
    A.fields;

    expect(() => A._fields).toThrowError(/use the 'fields' property/);
    expect(() => (A._fields = {})).toThrowError(/already been bound/);

    // Extending a class after it's had it's fields accessed should still work
    class B extends A {}
    B.fields;

    expect(() => B._fields).toThrowError(/use the 'fields' property/);
    expect(() => (B._fields = {})).toThrowError(/already been bound/);

    // Should be able to mess with _fields before fields has been accessed
    class C extends ViewModel {
        static _fields: Record<string, Field<any>> = {
            id: new Field({ label: 'id' }),
            name: new Field({ label: 'id' }),
        };
    }
    C._fields.age = new Field({ label: 'age' });
    expect(C.fields.age).toBeInstanceOf(Field);

    expect(() => (C._fields.email = new Field({ label: 'email' }))).toThrowError(
        /use the 'fields' property/
    );
});

test('name and label should be set automatically', () => {
    class A extends ViewModel {
        static _fields: Record<string, Field<any>> = {
            id: new Field(),
            firstName: new Field(),
            LastName: new Field(),
            // eslint-disable-next-line @typescript-eslint/camelcase
            email_address: new Field(),
            CONTACT_NUMBER: new Field(),
            age: new Field({ label: 'User Age' }),
        };
    }
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
    class A extends ViewModel {}
    expect(A.fields.id).toBeInstanceOf(NumberField);
    expect(A.pkFieldName).toBe('id');

    class B extends ViewModel {
        static getImplicitPkField(): [string, Field<any>] {
            return ['EntityId', new CharField()];
        }
    }

    expect(B.pkFieldName).toBe('EntityId');
    expect(B.fields.EntityId).toBeInstanceOf(CharField);

    class C extends ViewModel {
        static getImplicitPkField(): [string[], Field<any>[]] {
            return [
                ['model', 'uuid'],
                [new CharField(), new NumberField()],
            ];
        }
    }
    expect(C.pkFieldName).toEqual(['model', 'uuid']);
    expect(C.fields.model).toBeInstanceOf(CharField);
    expect(C.fields.uuid).toBeInstanceOf(NumberField);

    class D extends ViewModel {
        static _fields = {
            id: new CharField(),
        };
    }
    expect(D.fields.id).toBeInstanceOf(CharField);
    expect(D.pkFieldName).toBe('id');

    class DynamicBase extends ViewModel {
        static getImplicitPkField(): [string, Field<any>] {
            if ('EntityId' in this.unboundFields) {
                return ['EntityId', this.unboundFields.EntityId];
            }

            // Generate a name base on model, eg. `userId`
            const name = this.name[0].toLowerCase() + this.name.slice(1);
            return [`${name}Id`, new NumberField()];
        }
    }

    class User extends DynamicBase {}
    expect(User.pkFieldName).toEqual('userId');
    expect(User.fields.userId).toBeInstanceOf(NumberField);

    // Multi level inheritance should follow same rules and not inherit implicit
    // keys from parent
    class AdminUser extends User {}
    expect(AdminUser.pkFieldName).toEqual('adminUserId');
    expect(AdminUser.fields.adminUserId).toBeInstanceOf(NumberField);
    expect(User.pkFieldName).toEqual('userId');
    expect(User.fields.userId).toBeInstanceOf(NumberField);

    // Multi level inheritance should follow same rules and not inherit implicit
    // keys from parent
    class BlogPost extends DynamicBase {
        static _fields = {
            EntityId: new CharField(),
        };
    }
    expect(BlogPost.pkFieldName).toEqual('EntityId');
    expect(BlogPost.fields.EntityId).toBeInstanceOf(CharField);
});

// This test is skipped because defining a static property like below in the test env
// actually triggers the ViewModel setter on 'fields'. This does not happen anywhere
// else that I can replicate - eg. in compiled code in browser, uncompiled code (eg.
// using native ES6 classes), in node with uncompiled code. I haven't been able to work
// out why the difference...
test.skip('ViewModel should identify incorrectly defined fields', () => {
    class A extends ViewModel {
        static fields = {
            name: new Field({ label: 'Name' }),
        };
    }
    expect(() => new A({})).toThrowError(/has not been defined correctly/);
});

test('ViewModel should validate primary key fields exist when binding fields', () => {
    // Passing data for fields that don't exist triggers a warning; suppress them for this test
    // eslint-disable-next-line
    const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    class A extends ViewModel {}

    const record1 = new A({ id: 1 });
    expect(record1._pk).toBe(1);

    class B extends ViewModel {
        static pkFieldName = ['id1', 'id2'];
    }
    expect(() => B.fields).toThrow(
        /B has 'pkFieldName' set to 'id1, id2' but the field\(s\) 'id1, id2'/
    );

    class C extends ViewModel {
        static pkFieldName = ['id1', 'id2'];
        static _fields = {
            id1: new Field({ label: 'Id' }),
        };
    }

    expect(() => C.fields).toThrow(
        /C has 'pkFieldName' set to 'id1, id2' but the field\(s\) 'id2'/
    );

    mockWarn.mockRestore();
});

test('ViewModel._pk should return primary key', () => {
    class A extends ViewModel {
        static _fields = {
            id: new Field({ label: 'Id' }),
        };
    }

    const record1 = new A({ id: 1 });
    expect(record1._pk).toBe(1);

    class B extends ViewModel {
        static pkFieldName = ['id1', 'id2'];
        static _fields = {
            id1: new Field({ label: 'Id' }),
            id2: new Field({ label: 'Id' }),
        };
    }

    const record2 = new B({ id1: 1, id2: 2 });
    expect(record2._pk).toEqual({ id1: 1, id2: 2 });
});

test('should validate primary key is provided', () => {
    class A extends ViewModel {
        static _fields = {
            id: new Field({ label: 'Id' }),
        };
    }

    expect(() => new A({})).toThrowError("Missing value(s) for primary key(s) 'id'");
    expect(() => new A({ id: null })).toThrowError(
        "Primary key(s) 'id' was provided but was null or undefined"
    );
});

test('should validate primary keys are provided', () => {
    class A extends ViewModel {
        static pkFieldName = ['id1', 'id2'];
        static _fields = {
            id1: new Field({ label: 'Id1' }),
            id2: new Field({ label: 'Id2' }),
        };
    }

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

test('_assigned fields should be based on passed data', () => {
    class A extends ViewModel {
        static _fields = {
            id: new Field({ label: 'Id' }),
            name: new Field({ label: 'Name' }),
            email: new Field({ label: 'Email' }),
        };
    }

    let record = new A({ id: 1 });
    expect(record._assignedFields).toEqual(['id']);

    record = new A({ id: 1, name: 'Dave' });
    expect(record._assignedFields).toEqual(['id', 'name']);
    record = new A({ id: 1, name: 'Dave', email: 'a@b.com' });
    expect(record._assignedFields).toEqual(['email', 'id', 'name']);
});

test('toJS() should be return assigned data', () => {
    class A extends ViewModel {
        static _fields = {
            id: new Field({ label: 'Id' }),
            name: new Field({ label: 'Name' }),
            email: new Field({ label: 'Email' }),
        };
    }

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
    class A extends ViewModel {
        static _fields = {
            id: new Field({ label: 'Id' }),
            name: new Field({ label: 'Name' }),
            email: new LowerField({ label: 'Email' }),
        };
    }

    const record = new A({ id: 1, name: 'Dave', email: 'A@B.COM' });
    expect(record.toJS()).toEqual({ id: 1, name: 'Dave', email: 'a@b.com' });
});

test('ViewModel should use normalize() from field', () => {
    class LowerField extends Field<string> {
        normalize(value: any): string {
            return value.toString().toLowerCase();
        }
    }
    class A extends ViewModel {
        static _fields = {
            id: new Field({ label: 'Id' }),
            name: new Field({ label: 'Name' }),
            email: new LowerField({ label: 'Email' }),
        };
    }

    const record = new A({ id: 1, name: 'Dave', email: 'A@B.COM' });
    expect(record.email).toBe('a@b.com');
});

test('Should be able to compare if two records are equal', () => {
    class TestDateField extends Field<Date> {
        isEqual(value1: Date, value2: Date): boolean {
            return value1.getTime() === value2.getTime();
        }
    }
    class A extends ViewModel {
        static _fields = {
            id: new Field({ label: 'Id' }),
            name: new Field({ label: 'Name' }),
            email: new Field({ label: 'Email' }),
            createdAt: new TestDateField({ label: 'Created At' }),
        };
    }

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

    class B extends ViewModel {
        static _fields = {
            id: new Field({ label: 'Id' }),
            name: new Field({ label: 'Name' }),
            email: new Field({ label: 'Email' }),
            createdAt: new TestDateField({ label: 'Created At' }),
        };
    }
    const data = {
        id: 1,
        name: 'John',
        email: 'a@b.com',
    };
    expect(new A(data).isEqual(new B(data))).toBe(false);
});

test('should clone a ViewModel record', () => {
    class A extends ViewModel {
        static _fields = {
            id: new Field({ label: 'Id' }),
            name: new Field({ label: 'Name' }),
            email: new Field({ label: 'Email' }),
        };
    }

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
        class A extends ViewModel {
            static _fields = {
                id: new Field({ label: 'Id' }),
                name: new Field({ label: 'Name' }),
                email: new Field({ label: 'Email' }),
            };
        }
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
        expect(() => record2.email).toThrowError(/not fetched/);

        process.env.NODE_ENV = 'production';

        // eslint-disable-next-line
        const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
        record2.email;
        expect(mockWarn).toHaveBeenCalledWith(
            'email accessed but not fetched. Available fields are: id, name'
        );
    });

    test('should error if attempt to set a field', () => {
        process.env.NODE_ENV = 'development';
        class A extends ViewModel {
            static _fields = {
                id: new Field({ label: 'Id' }),
                name: new Field({ label: 'Name' }),
                email: new Field({ label: 'Email' }),
            };
        }
        const record1 = new A({
            id: 1,
            name: 'bob',
            email: 'a@b',
        });
        expect(() => (record1.email = 'test')).toThrowError('email is read only');

        process.env.NODE_ENV = 'production';

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
        expect(() => (record1._data.name = 'jo')).toThrowError(/read only/);

        expect(record1._data).toEqual({
            id: 1,
            name: 'bob',
            email: 'a@b',
        });
    });
});
