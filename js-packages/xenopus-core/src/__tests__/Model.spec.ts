import Model from '../Model';
import Field from '../fields/Field';

test('Model._fields returns defined fields', () => {
    class A extends Model {
        static firstName = new Field({ name: 'firstName', label: 'First Name' });
        static lastName = new Field({ name: 'lastName', label: 'Last Name' });
    }

    const record1 = new A();
    expect(record1._fields).toEqual({
        firstName: A.firstName,
        lastName: A.lastName,
    });
    // Static or non-static should be the same
    expect(record1._fields).toEqual(A._fields);

    class B extends A {
        static lastName = new Field({ name: 'lastName', label: 'Last Name' });
        static phone = new Field({ name: 'phone', label: 'Phone' });
    }

    const record2 = new B();
    // Should be same field as not overridden
    expect(record2._fields.firstName).toBe(A.firstName);
    // Should be different field as IS overridden
    expect(record2._fields.lastName).not.toBe(A.lastName);
    // Should include extra fields added
    expect(record2._fields).toEqual({
        firstName: B.firstName,
        lastName: B.lastName,
        phone: B.phone,
    });
    expect(record2._fields).toEqual(B._fields);
});

test('Model._fields supports _meta', () => {
    class A extends Model {
        static _meta = {
            label: 'A',
            labelPlural: "A's",
        };
    }

    const record1 = new A();
    expect(A._meta).toEqual({
        label: 'A',
        labelPlural: "A's",
    });
    expect(record1._meta).toEqual(A._meta);

    class B extends A {}

    const record2 = new B();
    expect(B._meta).toEqual({
        label: 'A',
        labelPlural: "A's",
    });
    expect(record2._meta).toEqual(B._meta);

    class C extends B {
        static _meta = {
            label: 'C',
            labelPlural: "C's",
        };
    }

    const record3 = new C();
    expect(C._meta).toEqual({
        label: 'C',
        labelPlural: "C's",
    });
    expect(record3._meta).toEqual(C._meta);
});
