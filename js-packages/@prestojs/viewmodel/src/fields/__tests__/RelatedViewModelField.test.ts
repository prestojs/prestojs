// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import viewModelFactory, { ViewModelConstructor } from '../../ViewModelFactory';
import Field from '../Field';
import RelatedViewModelField from '../RelatedViewModelField';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R, T> {
            toBeEqualToRecord(received: any, msg?: string): R;
        }
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createTestModels(circular = false, promise = false) {
    class Group extends viewModelFactory({
        name: new Field<string>(),
        ...(circular
            ? {
                  ownerId: new Field<number>(),
                  owner: new RelatedViewModelField({
                      // Type here isn't typeof User as it seemed to confuse typescript.. I guess
                      // because of the circular reference
                      to: promise
                          ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
                            (): Promise<ViewModelConstructor<any>> => Promise.resolve(User)
                          : // eslint-disable-next-line @typescript-eslint/no-use-before-define
                            (): ViewModelConstructor<any> => User,
                      sourceFieldName: 'ownerId',
                  }),
              }
            : {}),
    }) {}
    class User extends viewModelFactory({
        name: new Field<string>(),
        groupId: new Field<number | null>(),
        group: new RelatedViewModelField({
            to: promise ? (): Promise<typeof Group> => Promise.resolve(Group) : Group,
            sourceFieldName: 'groupId',
        }),
    }) {}
    class Subscription extends viewModelFactory({
        userId: new Field<number>(),
        user: new RelatedViewModelField<typeof User>({
            to: promise ? (): Promise<typeof User> => Promise.resolve(User) : User,
            sourceFieldName: 'userId',
        }),
    }) {}
    return { User, Group, Subscription };
}

test('should validate sourceFieldName', () => {
    const User = viewModelFactory({});
    expect(() => {
        viewModelFactory({
            user: new RelatedViewModelField({
                to: (): Promise<typeof User> => Promise.resolve(User),
                sourceFieldName: 'userId',
            }),
        }).fields;
    }).toThrow(/'userId' does not exist on/);

    viewModelFactory({
        userId: new Field<number>(),
        user: new RelatedViewModelField({
            to: (): Promise<typeof User> => Promise.resolve(User),
            sourceFieldName: 'userId',
        }),
    });
});

test('creating with nested data should populate sourceFieldName', async () => {
    const { User } = createTestModels();
    const user = new User({
        id: 1,
        name: 'test',
        group: {
            id: 1,
            name: 'Group 1',
        },
    });
    // Can we fix this? Return type is inferred from values passed in... groupId
    // is added because 'group' exists but can't be inferred
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(user.groupId).toBe(1);
    expect(user._assignedFields).toEqual(['group', 'groupId', 'id', 'name']);
});

test.each`
    resolveViewModel
    ${true}
    ${false}
`(
    'should support circular references (requires resolveViewModel: $resolveViewModel)',
    async ({ resolveViewModel }) => {
        const { User, Group } = createTestModels(true, resolveViewModel);
        if (resolveViewModel) {
            await User.fields.group.resolveViewModel();
        }
        Group.cache.add({ id: 1, name: 'Staff', ownerId: 1 });
        User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
        expect(
            User.cache.get(1, ['name', ['group', 'name'], ['group', 'owner']])
        ).toBeEqualToRecord(
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
        );
        // Another level...
        expect(
            User.cache.get(1, [
                'name',
                ['group', 'name'],
                ['group', 'owner', 'name'],
                ['group', 'owner', 'group'],
            ])
        ).toBeEqualToRecord(
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
        );
        expect(
            User.cache.get(1, [
                'name',
                ['group', 'name'],
                ['group', 'owner', 'name'],
                ['group', 'owner', 'group', 'owner'],
            ])
        ).toBeEqualToRecord(
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
                            ownerId: 1,
                            owner: {
                                id: 1,
                                name: 'Bob',
                                groupId: 1,
                            },
                        },
                    },
                },
            })
        );
    }
);

test('toJS should traverse relations', async () => {
    const { User } = createTestModels();

    expect(
        new User({
            id: 1,
            name: 'Test',
            groupId: null,
        }).toJS()
    ).toEqual({
        id: 1,
        name: 'Test',
        groupId: null,
    });

    expect(
        new User({
            id: 1,
            name: 'Test',
            group: {
                id: 2,
                name: 'Staff',
            },
        }).toJS()
    ).toEqual({
        id: 1,
        name: 'Test',
        groupId: 2,
        group: {
            id: 2,
            name: 'Staff',
        },
    });
});
test('normalize should create nested records as instances of related model', async () => {
    const { User, Group } = createTestModels();
    const user1 = new User({
        id: 1,
        name: 'Test',
        group: {
            id: 2,
            name: 'Staff',
        },
    });
    expect(user1.group).toBeEqualToRecord(new Group({ id: 2, name: 'Staff' }));
    // Should also work if instance of relation is passed in
    const user2 = new User({
        id: 1,
        name: 'Test',
        group: new Group({
            id: 2,
            name: 'Staff',
        }),
    });
    expect(user2.group).toBeEqualToRecord(new Group({ id: 2, name: 'Staff' }));
});

test('should warn if related model is included but has mismatch on id', async () => {
    const { User } = createTestModels();
    const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => undefined);
    new User({
        id: 1,
        name: 'Test',
        groupId: 1,
        group: {
            id: 2,
            name: 'Staff',
        },
    });
    expect(mockWarn).toHaveBeenCalledWith(
        expect.stringMatching(
            /was created from nested object that had a different id to the source field name/
        )
    );
});
test('normalize should create nested records as instances of related model', async () => {
    expect(() => createTestModels(false, true).User.fields.group.to.fields).toThrowError(
        /Call User.fields.group.resolveViewModel\(\) first/
    );
    // Should be fine
    createTestModels(false, false).User.fields.group.to.fields;
    const { User } = createTestModels();
    User.fields.group.resolveViewModel();
    User.fields.group.to.fields;
});

// TODO: Is there a need to support compound fields? Would that mean sourceFieldName would have to be an array?
