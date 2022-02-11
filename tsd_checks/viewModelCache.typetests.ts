/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
    Field,
    ListField,
    ManyRelatedViewModelField,
    PartialViewModel,
    RelatedViewModelField,
    ViewModelCache,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { expectAssignable, expectError, expectType } from 'tsd';

class Group extends viewModelFactory(
    {
        id: new Field<number>(),
        groupName: new Field<string>(),
    },
    { pkFieldName: 'id' }
) {}

class User extends viewModelFactory(
    {
        id: new Field<number>(),
        firstName: new Field<string>(),
        groupId: new Field<number | null>(),
        group: new RelatedViewModelField<typeof Group, 'groupId'>({
            to: Group,
            sourceFieldName: 'groupId',
        }),
        groupIds: new ListField({ childField: new Field<number>() }),
        groups: new ManyRelatedViewModelField<typeof Group, 'groupIds'>({
            to: Group,
            sourceFieldName: 'groupIds',
        }),
    },
    { pkFieldName: 'id' }
) {
    static cache: ViewModelCache<typeof User> = new ViewModelCache(User);

    getFullName(): string {
        return '';
    }
}

{
    // Test 'add', 'addList'
    const user1 = new User({ id: 1, firstName: 'user1' });
    const user2 = new User({ id: 2, firstName: 'user2' });
    expectAssignable<typeof user1>(User.cache.add(user1));
    const users = [user1, user2];
    expectAssignable<typeof users>(User.cache.add(users));
    expectAssignable<typeof users>(User.cache.addList(users));
    expectAssignable<PartialViewModel<typeof User, 'firstName' | 'id'>>(
        User.cache.add({
            id: 1,
            firstName: 'user1',
        })
    );
    const usersRaw = [
        {
            id: 1,
            firstName: 'user1',
        },
        {
            id: 2,
            firstName: 'user2',
        },
    ];
    expectAssignable<PartialViewModel<typeof User, 'firstName' | 'id'>[]>(User.cache.add(usersRaw));
    expectAssignable<PartialViewModel<typeof User, 'firstName' | 'id'>[]>(
        User.cache.addList(usersRaw)
    );
    expectAssignable<PartialViewModel<typeof User, 'firstName' | 'id'>[]>(
        User.cache.add([...users, ...usersRaw])
    );
    expectAssignable<PartialViewModel<typeof User, 'firstName' | 'id'>[]>(
        User.cache.addList([...users, ...usersRaw])
    );
}

{
    // Test 'getAll'
    const first1 = User.cache.getAll(['firstName'])[0];
    expectError(first1.group);
    expectType<number>(first1.id);
    expectType<string>(first1.firstName);
    expectAssignable<PartialViewModel<typeof User, 'firstName' | 'id'>[]>(
        User.cache.getAll(['firstName'])
    );
    const first2 = User.cache.getAll(['firstName', ['group', 'groupName']])[0];
    expectType<Group>(first2.group);
    expectType<number | null>(first2.groupId);
    expectType<number>(first2.id);
    expectType<string>(first2.firstName);
    expectAssignable<PartialViewModel<typeof User, 'firstName' | 'id' | 'group' | 'groupId'>[]>(
        User.cache.getAll(['firstName', ['group', 'groupName']])
    );
    const first3 = User.cache.getAll('*')[0];
    expectType<number | null>(first3.groupId);
    expectType<number[]>(first3.groupIds);
    expectType<number>(first3.id);
    expectType<string>(first3.firstName);
    expectType<
        PartialViewModel<
            typeof User,
            'firstName' | 'id' | 'groupId' | 'groupIds' | 'groups' | 'group'
        >[]
    >(User.cache.getAll('*'));
    const first4 = User.cache.getAll(['firstName', ['groups', 'groupName'], ['groups', 'id']])[0];
    expectType<Group[]>(first4.groups);
    expectType<number[]>(first4.groupIds);
    expectType<number>(first4.id);
    expectType<string>(first4.firstName);
    expectAssignable<PartialViewModel<typeof User, 'firstName' | 'id' | 'groups' | 'groupIds'>[]>(
        User.cache.getAll(['firstName', ['groups', 'groupName'], ['groups', 'id']])
    );
}

{
    // Test 'getList'
    // Default is to remove nulls so type of list type should reflect that
    const list1 = User.cache.getList([1], ['firstName']);
    expectType<PartialViewModel<typeof User, 'firstName' | 'id'>[]>(list1);
    const list2 = User.cache.getList([1], ['firstName'], false);
    expectType<(PartialViewModel<typeof User, 'firstName' | 'id'> | null)[]>(list2);
    expectType<PartialViewModel<typeof User, 'firstName' | 'id'>[]>(User.cache.getList(list1));
    expectType<(PartialViewModel<typeof User, 'firstName' | 'id'> | null)[]>(
        User.cache.getList(list1, false)
    );
    expectType<
        PartialViewModel<
            typeof User,
            'firstName' | 'id' | 'groupId' | 'groupIds' | 'groups' | 'group'
        >[]
    >(User.cache.getList([1], '*'));
    expectType<
        (PartialViewModel<
            typeof User,
            'firstName' | 'id' | 'groupId' | 'groupIds' | 'groups' | 'group'
        > | null)[]
    >(User.cache.getList([1], '*', false));
    const records = [
        new User({ id: 1, firstName: 'test' }),
        new User({ id: 1, firstName: 'test' }),
    ];
    expectType<typeof records>(User.cache.getList(records));
    expectType<(typeof records[number] | null)[]>(User.cache.getList(records, false));
}

{
    // Test 'get'
    const item1 = User.cache.get(1, ['firstName']);
    const item2 = new User({ id: 2, firstName: 'Test' });
    expectType<PartialViewModel<typeof User, 'firstName' | 'id'> | null>(item1);
    expectType<PartialViewModel<typeof User, 'firstName' | 'id'> | null>(User.cache.get(item2));
    expectType<PartialViewModel<
        typeof User,
        'firstName' | 'id' | 'groupId' | 'groupIds' | 'groups' | 'group'
    > | null>(User.cache.get(1, '*'));
}

{
    // Test 'addListener'
    User.cache.addListener(
        1,
        ['firstName'],
        (
            a?: PartialViewModel<typeof User, 'id' | 'firstName'> | null,
            b?: PartialViewModel<typeof User, 'id' | 'firstName'> | null
        ) => {
            // pass
        }
    );

    User.cache.addListener(
        [1],
        ['firstName'],
        (
            a?: (PartialViewModel<typeof User, 'id' | 'firstName'> | null)[],
            b?: (PartialViewModel<typeof User, 'id' | 'firstName'> | null)[]
        ) => {
            // pass
        }
    );

    User.cache.addListener(() => {
        // pass
    });
}
