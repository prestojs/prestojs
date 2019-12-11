import ViewModel from '../ViewModel';
import Field from '../fields/Field';

test('ViewModel._model returns class', () => {
    class A extends ViewModel {
        static fields = {
            id: new Field({ name: 'id', label: 'id' }),
        };
    }

    const record1 = new A({ id: 1 });
    expect(record1._model).toEqual(A);

    class B extends A {
        static fields = {
            id: new Field({ name: 'id', label: 'id' }),
        };
    }

    const record2 = new B({ id: 2 });
    expect(record2._model).toEqual(B);
});

test('ViewModel._pk should validate primary key fields exist', () => {
    // Passing data for fields that don't exist triggers a warning; suppress them for this test
    // eslint-disable-next-line
    const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    class A extends ViewModel {}

    const record1 = new A({ id: 1 });
    expect(() => record1._pk).toThrow(/A has 'pkFieldName' set to 'id' but/);

    class B extends ViewModel {
        static pkFieldName = ['id1', 'id2'];
    }

    const record2 = new B({ id1: 1, id2: 2 });
    expect(() => record2._pk).toThrow(
        /B has 'pkFieldName' set to 'id1, id2' but the fields 'id1, id2'/
    );

    class C extends ViewModel {
        static pkFieldName = ['id1', 'id2'];
        static fields = {
            id1: new Field({ name: 'id1', label: 'Id' }),
        };
    }

    const record3 = new C({ id1: 1, id2: 2 });
    expect(() => record3._pk).toThrow(/C has 'pkFieldName' set to 'id1, id2' but the field 'id2'/);

    mockWarn.mockRestore();
});

test('ViewModel._pk should return primary key', () => {
    class A extends ViewModel {
        static fields = {
            id: new Field({ name: 'id', label: 'Id' }),
        };
    }

    const record1 = new A({ id: 1 });
    expect(record1._pk).toBe(1);

    class B extends ViewModel {
        static pkFieldName = ['id1', 'id2'];
        static fields = {
            id1: new Field({ name: 'id1', label: 'Id' }),
            id2: new Field({ name: 'id2', label: 'Id' }),
        };
    }

    const record2 = new B({ id1: 1, id2: 2 });
    expect(record2._pk).toEqual({ id1: 1, id2: 2 });
});

test('should validate primary key is provided', () => {
    class A extends ViewModel {
        static fields = {
            id: new Field({ name: 'id', label: 'Id' }),
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
        static fields = {
            id1: new Field({ name: 'id1', label: 'Id1' }),
            id2: new Field({ name: 'id2', label: 'Id2' }),
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
        static fields = {
            id: new Field({ name: 'id', label: 'Id' }),
            name: new Field({ name: 'name', label: 'Name' }),
            email: new Field({ name: 'email', label: 'Email' }),
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
        static fields = {
            id: new Field({ name: 'id', label: 'Id' }),
            name: new Field({ name: 'name', label: 'Name' }),
            email: new Field({ name: 'email', label: 'Email' }),
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
        static fields = {
            id: new Field({ name: 'id', label: 'Id' }),
            name: new Field({ name: 'name', label: 'Name' }),
            email: new LowerField({ name: 'email', label: 'Email' }),
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
        static fields = {
            id: new Field({ name: 'id', label: 'Id' }),
            name: new Field({ name: 'name', label: 'Name' }),
            email: new LowerField({ name: 'email', label: 'Email' }),
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
        static fields = {
            id: new Field({ name: 'id', label: 'Id' }),
            name: new Field({ name: 'name', label: 'Name' }),
            email: new Field({ name: 'email', label: 'Email' }),
            createdAt: new TestDateField({ name: 'createdAt', label: 'Created At' }),
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
        static fields = {
            id: new Field({ name: 'id', label: 'Id' }),
            name: new Field({ name: 'name', label: 'Name' }),
            email: new Field({ name: 'email', label: 'Email' }),
            createdAt: new TestDateField({ name: 'createdAt', label: 'Created At' }),
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
        static fields = {
            id: new Field({ name: 'id', label: 'Id' }),
            name: new Field({ name: 'name', label: 'Name' }),
            email: new Field({ name: 'email', label: 'Email' }),
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
            static fields = {
                id: new Field({ name: 'id', label: 'Id' }),
                name: new Field({ name: 'name', label: 'Name' }),
                email: new Field({ name: 'email', label: 'Email' }),
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
            static fields = {
                id: new Field({ name: 'id', label: 'Id' }),
                name: new Field({ name: 'name', label: 'Name' }),
                email: new Field({ name: 'email', label: 'Email' }),
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
