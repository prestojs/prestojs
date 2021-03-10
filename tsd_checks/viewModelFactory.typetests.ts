/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
    CharField,
    Field,
    RelatedViewModelField,
    ViewModelConstructor,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { expectError, expectType } from 'tsd';

class Group extends viewModelFactory({
    name: new Field<string>(),
    ownerId: new Field<number>(),
    owner: new RelatedViewModelField({
        // Type here isn't typeof User as it seemed to confuse typescript.. I guess
        // because of the circular reference
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        to: (): Promise<ViewModelConstructor<any>> => Promise.resolve(User),
        sourceFieldName: 'ownerId',
    }),
}) {}
class User extends viewModelFactory({
    firstName: new Field<string>(),
    groupId: new Field<number | null>(),
    group: new RelatedViewModelField<typeof Group>({
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

//================================================================================================
// ViewModel field definitions and augment
User.fields.id;
User.fields.firstName;
User.fields.group;
User.fields.groupId;
expectError(User.fields.DOES_NOT_EXIST);
expectType<number>(new User({ id: 5 }).id);
expectType<number>(new User({ id: 1 })._key);
expectError(new User({ id: 1, INVALID_FIELD: 5 }));
expectError(new User({}));

class NewUser extends User.augment({ id: new CharField(), lastName: new CharField() }) {}
NewUser.fields.id;
NewUser.fields.firstName;
NewUser.fields.group;
NewUser.fields.groupId;
NewUser.fields.lastName;
expectError(NewUser.fields.DOES_NOT_EXIST);
expectType<string>(new NewUser({ id: 'ae123' }).id);
expectError(new NewUser({ id: 'ae123', INVALID_FIELD: 5 }));
expectError(new NewUser({}));

// TODO: This current fails... augmenting and changing primary key not yet supported
// @ts-ignore
expectType<string>(new NewUser({ id: 'ae123' })._key);

class NewUser2 extends NewUser.augment({ lastName: null, firstName: null }) {}
NewUser2.fields.id;
NewUser2.fields.group;
NewUser2.fields.groupId;
expectError(NewUser2.fields.firstName);
expectError(NewUser2.fields.lastName);
expectError(NewUser2.fields.DOES_NOT_EXIST);
expectType<string>(new NewUser2({ id: 'ae123' }).id);
expectError(new NewUser2({ id: 'ae123', INVALID_FIELD: 5 }));
expectError(new NewUser2({}));

//================================================================================================
// ViewModel pkFieldName
expectError(
    class PkFieldNameTest1 extends viewModelFactory(
        {
            name: new Field<string>(),
        },
        // field does not exist
        { pkFieldName: 'blah' }
    ) {}
);

class PkFieldNameTest1 extends viewModelFactory(
    {
        uid: new Field<string>(),
    },
    // field does not exist
    { pkFieldName: 'uid' }
) {}

// We can't easily validate primary key is supplied when customised so this doesn't error
new PkFieldNameTest1({});

expectType<'uid'>(PkFieldNameTest1.pkFieldName);

expectType<string>(new PkFieldNameTest1({ uid: 'abc' })._key);
expectError(new PkFieldNameTest1({ INVALID_FIELD: 1 }));

expectError(
    class PkFieldNameTest2 extends viewModelFactory(
        {
            field1: new Field<string>(),
            field2: new Field<number>(),
        },
        // field does not exist
        { pkFieldName: ['field1', 'field'] }
    ) {}
);

class PkFieldNameTest2 extends viewModelFactory(
    {
        field1: new Field<string>(),
        field2: new Field<number>(),
    },
    // field does not exist
    { pkFieldName: ['field1', 'field1'] }
) {}

// Would be nicer as a tuple ['field1', 'field2'] but don't think that's possible to infer
expectType<('field1' | 'field2')[]>(PkFieldNameTest2.pkFieldName);

const x = new PkFieldNameTest2({ field1: 'one', field2: 2 });
x._key;

class PkFieldNameTest3 extends viewModelFactory(
    {
        field1: new Field<string>(),
        field2: new Field<number>(),
    },
    // field does not exist
    {
        getImplicitPkField() {
            return ['foo', new Field<number>()];
        },
    }
) {}

// Can't infer literal type so will just be string
expectType<string>(PkFieldNameTest3.pkFieldName);
// This will error as `foo` isn't in the known fields, ignoring for now
// @ts-ignore
new PkFieldNameTest3({ foo: 5 });
