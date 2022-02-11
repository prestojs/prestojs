import BooleanField from '../fields/BooleanField';
import CharField from '../fields/CharField';
import Field from '../fields/Field';
import IntegerField from '../fields/IntegerField';
import ListField from '../fields/ListField';
import { ManyRelatedViewModelField, RelatedViewModelField } from '../fields/RelatedViewModelField';
import { normalizeFields } from '../fieldUtils';
import viewModelFactory from '../ViewModelFactory';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createBasicTestModels() {
    class Group extends viewModelFactory(
        {
            id: new IntegerField(),
            isActive: new BooleanField(),
            groupName: new CharField(),
        },
        { pkFieldName: 'id' }
    ) {}
    class User extends viewModelFactory(
        {
            userId: new IntegerField(),
            groupId: new ListField({ childField: new Field<number | null>() }),
            username: new CharField(),
            group: new ManyRelatedViewModelField({
                to: Group,
                sourceFieldName: 'groupId',
            }),
        },
        { pkFieldName: 'userId' }
    ) {}
    class Subscription extends viewModelFactory(
        {
            userId: new IntegerField(),
            planId: new IntegerField(),
            user: new RelatedViewModelField<typeof User>({
                to: (): typeof User => User,
                sourceFieldName: 'userId',
            }),
        },
        { pkFieldName: ['planId', 'userId'] }
    ) {}
    return { Group, User, Subscription };
}

test('normalizeFields', () => {
    const { User, Subscription } = createBasicTestModels();
    expect(normalizeFields(User, '*')).toBe(normalizeFields(User, '*'));
    expect(normalizeFields(User, '*')).toBe(
        normalizeFields(User, ['groupId', 'userId', 'username', 'group'])
    );
    expect(normalizeFields(User, ['groupId', 'userId', 'username'])).toBe(
        normalizeFields(User, ['username', 'groupId', 'userId'])
    );
    expect(normalizeFields(User, '*').fieldPaths).toEqual([
        ['group', 'groupName'],
        ['group', 'id'],
        ['group', 'isActive'],
        'groupId',
        'userId',
        'username',
    ]);
    expect(normalizeFields(User, ['username', ['group', 'groupName']]).fieldPaths).toEqual([
        ['group', 'groupName'],
        ['group', 'id'],
        'groupId',
        'userId',
        'username',
    ]);
    expect(normalizeFields(User, ['username', 'group']).fieldPaths).toEqual([
        ['group', 'groupName'],
        ['group', 'id'],
        ['group', 'isActive'],
        'groupId',
        'userId',
        'username',
    ]);
    expect(normalizeFields(User, ['username', 'group']).fieldPaths).toEqual([
        ['group', 'groupName'],
        ['group', 'id'],
        ['group', 'isActive'],
        'groupId',
        'userId',
        'username',
    ]);
    const expected = [
        'planId',
        ['user', 'group', 'groupName'],
        ['user', 'group', 'id'],
        ['user', 'group', 'isActive'],
        ['user', 'groupId'],
        ['user', 'userId'],
        ['user', 'username'],
        'userId',
    ];

    expect(
        normalizeFields(Subscription, [
            ['user', 'group', 'groupName'],
            ['user', 'group', 'isActive'],
            ['user', 'username'],
        ]).fieldPaths
    ).toEqual(expected);
    expect(
        normalizeFields(Subscription, [
            ['user', 'group'],
            ['user', 'username'],
        ]).fieldPaths
    ).toEqual(expected);
    expect(
        normalizeFields(Subscription, [
            ['user', 'group'],
            ['user', 'username'],
        ]).fieldPaths
    ).toEqual(expected);
    expect(
        normalizeFields(Subscription, [
            ['user', 'username'],
            ['user', 'group'],
        ]).fieldPaths
    ).toEqual(expected);
});
