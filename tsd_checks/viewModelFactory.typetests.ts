/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
    CharField,
    Field,
    FieldPath,
    FieldPaths,
    ListField,
    ManyRelatedViewModelField,
    PartialViewModel,
    RelatedViewModelField,
    ViewModelCache,
    ViewModelConstructor,
    viewModelFactory,
    ViewModelInterface,
} from '@prestojs/viewmodel';
import { expectAssignable, expectError, expectNotAssignable, expectType } from 'tsd';

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
) {
    getName(): string {
        return this.name;
    }
}
class User extends viewModelFactory(
    {
        id: new Field<number>(),
        firstName: new Field<string>(),
        groupId: new Field<number | null>(),
        group: new RelatedViewModelField({
            to: (): Promise<typeof Group> => Promise.resolve(Group),
            sourceFieldName: 'groupId',
        }),
    },
    { pkFieldName: 'id' }
) {
    getName(): string {
        return this.firstName;
    }

    get nameLength(): number {
        return this.getName().length;
    }
}

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

class NotificationGroup extends viewModelFactory(
    {
        id: new Field<number>(),
        userIds: new ListField({ childField: new Field<number>() }),
        users: new ManyRelatedViewModelField({
            to: User,
            sourceFieldName: 'userIds',
        }),
    },
    { pkFieldName: 'id' }
) {}

//================================================================================================
// ViewModel field definitions and augment
{
    User.fields.id;
    User.fields.firstName;
    User.fields.group;
    User.fields.groupId;
    expectError(User.fields.DOES_NOT_EXIST);
    expectType<number>(new User({ id: 5 }).id);
    expectType<number>(new User({ id: 1 })._key);
    expectError(new User({ id: 1, INVALID_FIELD: 5 }));
    expectError(new User({}));
    expectAssignable<ViewModelConstructor<any, any>>(User);

    class NewUser extends User.augment({ id: new CharField(), lastName: new CharField() }, {}) {
        static cache = new ViewModelCache(NewUser);
    }
    expectAssignable<ViewModelConstructor<any, any>>(NewUser);

    NewUser.fields.id;
    NewUser.fields.firstName;
    NewUser.fields.group;
    NewUser.fields.groupId;
    NewUser.fields.lastName;
    expectError(NewUser.fields.DOES_NOT_EXIST);
    expectType<string>(new NewUser({ id: 'ae123' }).id);
    expectError(new NewUser({ id: 'ae123', INVALID_FIELD: 5 }));
    expectError(new NewUser({}));

    expectType<string>(new NewUser({ id: 'ae123' })._key);
    NewUser.pkFieldName;

    // Without specifying pkFieldName for a 2nd augment it loses type on it and causes other issue.
    class NewUser2 extends NewUser.augment(
        { lastName: null, firstName: null },
        { pkFieldName: 'id' }
    ) {}
    expectAssignable<ViewModelConstructor<any, any>>(NewUser2);

    NewUser2.fields.id;
    NewUser2.fields.group;
    NewUser2.fields.groupId;
    expectError(NewUser2.fields.firstName);
    expectError(NewUser2.fields.lastName);
    expectError(NewUser2.fields.DOES_NOT_EXIST);
    expectType<string>(new NewUser2({ id: 'ae123' }).id);
    expectError(new NewUser2({ id: 'ae123', INVALID_FIELD: 5 }));
    expectError(new NewUser2({}));
}

//================================================================================================
// ViewModel pkFieldName
{
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

    expectError(new PkFieldNameTest1({}));

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
        { pkFieldName: ['field1', 'field2'] }
    ) {}

    // Would be nicer as a tuple ['field1', 'field2'] but don't think that's possible to infer
    expectType<('field1' | 'field2')[]>(PkFieldNameTest2.pkFieldName);

    const x = new PkFieldNameTest2({ field1: 'one', field2: 2 });
    x._key;

    class AugmentedUser extends User.augment(
        { id: new CharField(), lastName: new CharField() },
        {}
    ) {}
    expectType<'id'>(AugmentedUser.pkFieldName);
    expectType<['id']>(AugmentedUser.pkFieldNames);
    class AugmentedUserNewIdField extends User.augment(
        { id: null, newId: new CharField(), lastName: new CharField() },
        { pkFieldName: 'newId' }
    ) {}
    expectType<'newId'>(AugmentedUserNewIdField.pkFieldName);
    expectType<['newId']>(AugmentedUserNewIdField.pkFieldNames);

    // Test compound pk field augmentation
    class CompoundModel extends viewModelFactory(
        {
            id1: new Field<number>(),
            id2: new Field<string>(),
            firstName: new Field<string>(),
        },
        { pkFieldName: ['id1', 'id2'] }
    ) {}
    // TODO: Without explicit pkFieldName pkFieldName type will be any. This is because of `augment` but haven't worked out why.
    class CompoundModel2 extends CompoundModel.augment(
        { lastName: new Field<string>() },
        { pkFieldName: ['id1', 'id2'] }
    ) {}
    expectType<('id1' | 'id2')[]>(CompoundModel2.pkFieldName);
    expectType<('id1' | 'id2')[]>(CompoundModel2.pkFieldNames);
}

//================================================================================================
// RelatedViewModelField value types
{
    const group = new User({ id: 5, group: { ownerId: 5 } }).group;
    expectType<Group>(group);

    const partialUser = new User({ id: 5 }) as PartialViewModel<
        typeof User,
        'firstName' | 'groupId'
    >;
    expectAssignable<string>(partialUser.getName());
    expectAssignable<number>(partialUser.nameLength);
    expectAssignable<number>(partialUser.id);
    expectAssignable<(keyof typeof partialUser['_data'])[]>(['id', 'firstName', 'groupId']);

    expectAssignable<ViewModelInterface<any, any>>(new User({ id: 5 }));
    expectAssignable<ViewModelConstructor<any, any>>(User);

    const notificationGroup = new NotificationGroup({ id: 1, users: [new User({ id: 5 })] });
    expectType<User[]>(notificationGroup.users);
    expectType<number[]>(notificationGroup.userIds);

    const subscription = new Subscription({ id: 1, user: new User({ id: 5 }) });
    expectType<User>(subscription.user);
}

{
    Subscription.getField('user');
    Subscription.getField('userId');
    Subscription.getField(['user', 'id']);
    Subscription.getField(['user', 'group']);
    Subscription.getField(['user', 'id']);

    expectAssignable<FieldPaths<typeof User>>('*');
    expectAssignable<FieldPath<typeof User>>('group');
    expectAssignable<FieldPath<typeof User>[]>(['group', 'firstName', 'groupId', 'id']);
    expectNotAssignable<FieldPath<typeof User>[]>(['group', 'firstName', 'groupId', 'id', 'blah']);
    expectNotAssignable<FieldPath<typeof User>[]>(['group', 'owner']);
    expectAssignable<FieldPath<typeof User>[]>(['groupId', ['group', 'owner']]);
    expectAssignable<FieldPath<typeof User>[]>(['groupId', ['group', 'owner'], ['group', 'id']]);
    expectAssignable<FieldPath<typeof User>[]>([
        'groupId',
        ['group', 'owner'],
        ['group', 'owner', 'firstName'],
    ]);
    expectNotAssignable<FieldPath<typeof User>[]>([
        'groupId',
        ['group', 'owner'],
        ['group', 'owner', 'firstNam'],
    ]);
}

{
    class CompoundModel extends viewModelFactory(
        {
            id1: new Field<number>(),
            id2: new Field<string>(),
            field1: new Field<string>(),
            field2: new Field<string>(),
        },
        { pkFieldName: ['id1', 'id2'] }
    ) {}
    expectAssignable<ViewModelInterface<any, any>>(new CompoundModel({ id1: 5, id2: 'string' }));
    expectAssignable<ViewModelConstructor<any, any>>(CompoundModel);
    type PartialCompoundModel = PartialViewModel<typeof CompoundModel, 'field1'>;
    expectAssignable<(keyof PartialCompoundModel['_f'])[]>(['id1', 'id2', 'field1']);
}
