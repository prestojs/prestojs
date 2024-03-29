import ViewModelCache from '../../ViewModelCache';
import viewModelFactory, { ViewModelConstructor } from '../../ViewModelFactory';
import CharField from '../CharField';
import Field from '../Field';
import IntegerField from '../IntegerField';
import ListField from '../ListField';
import { ManyRelatedViewModelField, RelatedViewModelField } from '../RelatedViewModelField';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            toBeEqualToRecord(received: any, msg?: string): R;
        }
    }
}

describe('RelatedViewModelField', () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function createTestModels(circular = false, promise = false) {
        class Group extends viewModelFactory(
            {
                id: new Field<number>(),
                name: new Field<string>(),
                ...(circular
                    ? {
                          ownerId: new Field<number>(),
                          owner: new RelatedViewModelField({
                              // Type here isn't typeof User as it seemed to confuse typescript.. I guess
                              // because of the circular reference
                              to: promise
                                  ? (): Promise<ViewModelConstructor<any, any>> =>
                                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                                        Promise.resolve(User)
                                  : // eslint-disable-next-line @typescript-eslint/no-use-before-define
                                    (): ViewModelConstructor<any, any> => User,
                              sourceFieldName: 'ownerId',
                          }),
                      }
                    : {}),
            },
            { pkFieldName: 'id' }
        ) {}
        class User extends viewModelFactory(
            {
                id: new Field<number>(),
                name: new Field<string>(),
                groupId: new Field<number | null>(),
                group: new RelatedViewModelField({
                    to: promise ? (): Promise<typeof Group> => Promise.resolve(Group) : Group,
                    sourceFieldName: 'groupId',
                }),
            },
            { pkFieldName: 'id' }
        ) {}
        class Subscription extends viewModelFactory(
            {
                id: new Field<number>(),
                userId: new Field<number>(),
                user: new RelatedViewModelField<typeof User>({
                    to: promise ? (): Promise<typeof User> => Promise.resolve(User) : User,
                    sourceFieldName: 'userId',
                }),
            },
            { pkFieldName: 'id' }
        ) {}
        return { User, Group, Subscription };
    }

    test('should validate sourceFieldName', () => {
        const User = viewModelFactory(
            {
                id: new Field<number>(),
            },
            { pkFieldName: 'id' }
        );
        expect(() => {
            viewModelFactory(
                {
                    id: new Field<number>(),
                    user: new RelatedViewModelField({
                        to: (): Promise<typeof User> => Promise.resolve(User),
                        sourceFieldName: 'userId',
                    }),
                },
                { pkFieldName: 'id' }
            ).fields;
        }).toThrow(/'userId' does not exist on/);

        viewModelFactory(
            {
                id: new Field<number>(),

                userId: new Field<number>(),
                user: new RelatedViewModelField({
                    to: (): Promise<typeof User> => Promise.resolve(User),
                    sourceFieldName: 'userId',
                }),
            },
            { pkFieldName: 'id' }
        );
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore Recursive types cause problems
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
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore Recursive types cause problems
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
});

describe('ManyRelatedViewModelField', () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function createTestModels(circular = false, promise = false) {
        class Group extends viewModelFactory(
            {
                id: new Field<number>(),
                name: new Field<string>(),
                ...(circular
                    ? {
                          ownerId: new Field<number>(),
                          owner: new RelatedViewModelField({
                              // Type here isn't typeof User as it seemed to confuse typescript.. I guess
                              // because of the circular reference
                              to: promise
                                  ? (): Promise<ViewModelConstructor<any, any>> =>
                                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                                        Promise.resolve(User)
                                  : // eslint-disable-next-line @typescript-eslint/no-use-before-define
                                    (): ViewModelConstructor<any, any> => User,
                              sourceFieldName: 'ownerId',
                          }),
                      }
                    : {}),
            },
            { pkFieldName: 'id' }
        ) {}
        class User extends viewModelFactory(
            {
                id: new Field<number>(),
                name: new Field<string>(),
                groupIds: new ListField({ childField: new Field<number | null>() }),
                groups: new ManyRelatedViewModelField({
                    to: promise ? (): Promise<typeof Group> => Promise.resolve(Group) : Group,
                    sourceFieldName: 'groupIds',
                }),
            },
            { pkFieldName: 'id' }
        ) {}
        class Subscription extends viewModelFactory(
            {
                id: new Field<number>(),
                userId: new Field<number>(),
                user: new RelatedViewModelField<typeof User>({
                    to: promise ? (): Promise<typeof User> => Promise.resolve(User) : User,
                    sourceFieldName: 'userId',
                }),
            },
            { pkFieldName: 'id' }
        ) {}
        return { User, Group, Subscription };
    }

    test('creating with nested data should populate sourceFieldName', async () => {
        const { User } = createTestModels();
        const user = new User({
            id: 1,
            name: 'test',
            groups: [
                {
                    id: 1,
                    name: 'Group 1',
                },
                {
                    id: 2,
                    name: 'Group 2',
                },
            ],
        });
        expect(user.groupIds).toEqual([1, 2]);
        expect(user._assignedFields).toEqual(['groupIds', 'groups', 'id', 'name']);
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
                await User.fields.groups.resolveViewModel();
            }
            Group.cache.add({ id: 1, name: 'Staff', ownerId: 1 });
            User.cache.add({ id: 1, name: 'Bob', groupIds: [1] });
            expect(
                User.cache.get(1, ['name', ['groups', 'name'], ['groups', 'owner']])
            ).toBeEqualToRecord(
                new User({
                    id: 1,
                    name: 'Bob',
                    groupIds: [1],
                    groups: [
                        {
                            id: 1,
                            name: 'Staff',
                            ownerId: 1,
                            owner: {
                                id: 1,
                                name: 'Bob',
                                groupIds: [1],
                            },
                        },
                    ],
                })
            );
            // Another level...
            expect(
                User.cache.get(1, [
                    'name',
                    ['groups', 'name'],
                    ['groups', 'owner', 'name'],
                    ['groups', 'owner', 'groups'],
                ])
            ).toBeEqualToRecord(
                new User({
                    id: 1,
                    name: 'Bob',
                    groupIds: [1],
                    groups: [
                        {
                            id: 1,
                            name: 'Staff',
                            ownerId: 1,
                            owner: {
                                id: 1,
                                name: 'Bob',
                                groupIds: [1],
                                groups: [
                                    {
                                        id: 1,
                                        name: 'Staff',
                                        ownerId: 1,
                                    },
                                ],
                            },
                        },
                    ],
                })
            );
            expect(
                User.cache.get(1, [
                    'name',
                    ['groups', 'name'],
                    ['groups', 'owner', 'name'],
                    ['groups', 'owner', 'groups', 'owner'],
                ])
            ).toBeEqualToRecord(
                new User({
                    id: 1,
                    name: 'Bob',
                    groupIds: [1],
                    groups: [
                        {
                            id: 1,
                            name: 'Staff',
                            ownerId: 1,
                            owner: {
                                id: 1,
                                name: 'Bob',
                                groupIds: [1],
                                groups: [
                                    {
                                        id: 1,
                                        ownerId: 1,
                                        owner: {
                                            id: 1,
                                            name: 'Bob',
                                            groupIds: [1],
                                        },
                                    },
                                ],
                            },
                        },
                    ],
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
                groupIds: [],
            }).toJS()
        ).toEqual({
            id: 1,
            name: 'Test',
            groupIds: [],
        });

        expect(
            new User({
                id: 1,
                name: 'Test',
                groups: [
                    {
                        id: 2,
                        name: 'Staff',
                    },
                ],
            }).toJS()
        ).toEqual({
            id: 1,
            name: 'Test',
            groupIds: [2],
            groups: [
                {
                    id: 2,
                    name: 'Staff',
                },
            ],
        });
    });
    test('normalize should create nested records as instances of related model', async () => {
        const { User, Group } = createTestModels();
        const user1 = new User({
            id: 1,
            name: 'Test',
            groups: [
                {
                    id: 2,
                    name: 'Staff',
                },
            ],
        });
        expect(user1.groups).toBeEqualToRecord([new Group({ id: 2, name: 'Staff' })]);
        // Should also work if instance of relation is passed in
        const user2 = new User({
            id: 1,
            name: 'Test',
            groups: [
                new Group({
                    id: 2,
                    name: 'Staff',
                }),
            ],
        });
        expect(user2.groups).toBeEqualToRecord([new Group({ id: 2, name: 'Staff' })]);
    });

    test('should warn if related model is included but has mismatch on id', async () => {
        const { User } = createTestModels();
        const mockWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => undefined);
        new User({
            id: 1,
            name: 'Test',
            groupIds: [1],
            groups: [
                {
                    id: 2,
                    name: 'Staff',
                },
            ],
        });
        expect(mockWarn).toHaveBeenCalledWith(
            expect.stringMatching(
                /was created from nested object that had a different id to the source field name/
            )
        );
    });
    test('normalize should create nested records as instances of related model', async () => {
        expect(() => createTestModels(false, true).User.fields.groups.to.fields).toThrowError(
            /Call User.fields.groups.resolveViewModel\(\) first/
        );
        // Should be fine
        createTestModels(false, false).User.fields.groups.to.fields;
        const { User } = createTestModels();
        User.fields.groups.resolveViewModel();
        User.fields.groups.to.fields;
    });
});

test('should cache records with empty ManyRelatedViewModelFields', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field<number>(),

            name: new CharField(),
        },
        { pkFieldName: 'id' }
    ) {}
    class Test2 extends viewModelFactory(
        {
            id: new Field<number>(),
            records: new ManyRelatedViewModelField({
                to: Test1,
                sourceFieldName: 'recordIds',
            }),
            recordIds: new ListField({
                childField: new IntegerField(),
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1 = new Test2({ id: 5, records: [{ id: 1, name: 'Test1' }] });
    expect(new Set(record1._assignedFields)).toEqual(new Set(['id', 'records', 'recordIds']));
    Test2.cache.add(record1);
    expect(Test2.cache.get(5, '*')?.toJS()).toEqual({
        id: 5,
        records: [{ id: 1, name: 'Test1' }],
        recordIds: [1],
    });

    const record2 = new Test2({ id: 6, records: [] });
    expect(new Set(record1._assignedFields)).toEqual(new Set(['id', 'records', 'recordIds']));
    Test2.cache.add(record2);
    expect(Test2.cache.get(6, '*')?.toJS()).toEqual({ id: 6, records: [], recordIds: [] });
});

test('should not break when related records are deleted', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new CharField(),
        },
        { pkFieldName: 'id' }
    ) {}
    class Test2 extends viewModelFactory(
        {
            id: new Field<number>(),
            records: new ManyRelatedViewModelField({
                to: Test1,
                sourceFieldName: 'recordIds',
            }),
            recordIds: new ListField({
                childField: new IntegerField(),
            }),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1 = new Test2({
        id: 5,
        records: [
            { id: 1, name: 'Test1' },
            { id: 2, name: 'Test2' },
        ],
    });
    Test2.cache.add(record1);
    expect(Test2.cache.get(5, '*')?.toJS()).toEqual({
        id: 5,
        records: [
            { id: 1, name: 'Test1' },
            { id: 2, name: 'Test2' },
        ],
        recordIds: [1, 2],
    });
    Test1.cache.delete(1);
});

test('should use correct cache key for nested related records', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new CharField(),
        },
        { pkFieldName: 'id' }
    ) {
        static cache: ViewModelCache<typeof Test1> = new ViewModelCache(Test1);
    }

    class Test2 extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new CharField(),
            record: new RelatedViewModelField({
                to: Test1,
                sourceFieldName: 'recordId',
            }),
            recordId: new IntegerField(),
        },
        { pkFieldName: 'id' }
    ) {
        static cache: ViewModelCache<typeof Test2> = new ViewModelCache(Test2);
    }

    class Test3 extends viewModelFactory(
        {
            id: new Field<number>(),
            records: new ManyRelatedViewModelField({
                to: Test2,
                sourceFieldName: 'recordIds',
            }),
            recordIds: new ListField({
                childField: new IntegerField(),
            }),
        },
        { pkFieldName: 'id' }
    ) {
        static cache: ViewModelCache<typeof Test3> = new ViewModelCache(Test3);
    }

    const record1 = new Test3({
        id: 3,
        records: [{ id: 2, name: 'Test2', record: { id: 1, name: 'Test 1' } }],
    });
    expect(new Set(record1._assignedFields)).toEqual(new Set(['id', 'records', 'recordIds']));
    Test3.cache.add(record1);
    expect(Test3.cache.get(record1)?.records[0].record.name).toBe('Test 1');
    expect(Test3.cache.getList([record1])[0]?.records[0].record.name).toBe('Test 1');
});

test('should cache records with empty RelatedViewModelFields', () => {
    class Test1 extends viewModelFactory(
        {
            id: new Field<number>(),
            name: new CharField(),
        },
        { pkFieldName: 'id' }
    ) {}
    class Test2 extends viewModelFactory(
        {
            id: new Field<number>(),
            record: new RelatedViewModelField({
                to: Test1,
                sourceFieldName: 'recordId',
            }),
            recordId: new IntegerField(),
        },
        { pkFieldName: 'id' }
    ) {}

    const record1 = new Test2({ id: 5, record: { id: 1, name: 'Test1' } });
    expect(new Set(record1._assignedFields)).toEqual(new Set(['id', 'record', 'recordId']));
    Test2.cache.add(record1);
    expect(Test2.cache.get(5, '*')?.toJS()).toEqual({
        id: 5,
        record: { id: 1, name: 'Test1' },
        recordId: 1,
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore TODO: Currently type doesn't allow `null`...
    const record2 = new Test2({ id: 6, record: null });
    expect(new Set(record2._assignedFields)).toEqual(new Set(['id', 'record', 'recordId']));
    Test2.cache.add(record2);
    expect(Test2.cache.get(6, '*')?.toJS()).toEqual({ id: 6, record: null, recordId: null });
});

// TODO: Is there a need to support compound fields? Would that mean sourceFieldName would have to be an array?
