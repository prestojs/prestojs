import Field from '../fields/Field';
import IntegerField from '../fields/IntegerField';
import { RelatedViewModelField } from '../fields/RelatedViewModelField';
import {
    __experimentalViewModelCacheDevtools,
    ViewModelMissEvent,
    ViewModelDevtoolsEvent,
    ViewModelWriteEvent,
} from '../index';
import viewModelFactory from '../ViewModelFactory';

describe('ViewModelCache devtools', () => {
    beforeEach(() => {
        __experimentalViewModelCacheDevtools.enable({ maxEvents: 1000 });
        __experimentalViewModelCacheDevtools.clear();
    });

    test('should be enabled by default in non-production env', () => {
        expect(__experimentalViewModelCacheDevtools.isEnabled()).toBe(true);
    });

    test('should emit write, delete and deleteAll events', () => {
        class TestUser extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
            },
            { pkFieldName: 'id' }
        ) {}

        TestUser.cache.add({ id: 1, name: 'Bob' });
        TestUser.cache.delete(1, ['name']);
        TestUser.cache.deleteAll();

        const { events } = __experimentalViewModelCacheDevtools.pullEvents(0);
        expect(events.map(event => event.op)).toEqual(['write', 'delete', 'deleteAll']);
        expect(events[0]).toMatchObject({
            modelName: 'TestUser',
            op: 'write',
            source: 'add',
            pk: 1,
            isAllFields: true,
            presentNonRelationFieldNames: ['id', 'name'],
            missingNonRelationFieldNames: [],
            value: { id: 1, name: 'Bob' },
        });
    });

    test('should mark write event as all fields only when all non-relation fields are present', () => {
        class TestUser extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
                email: new Field<string>(),
            },
            { pkFieldName: 'id' }
        ) {}

        TestUser.cache.add({ id: 1, name: 'Bob' });
        TestUser.cache.add({ id: 1, name: 'Bob', email: 'b@example.com' });

        const { events } = __experimentalViewModelCacheDevtools.pullEvents(0);
        const writeEvents = events.filter(event => event.op === 'write');
        expect(writeEvents).toHaveLength(2);
        expect(writeEvents[0]).toMatchObject({
            source: 'add',
            isAllFields: false,
            presentNonRelationFieldNames: ['id', 'name'],
            missingNonRelationFieldNames: ['email'],
        });
        expect(writeEvents[1]).toMatchObject({
            source: 'add',
            isAllFields: true,
            presentNonRelationFieldNames: expect.arrayContaining(['id', 'name', 'email']),
            missingNonRelationFieldNames: [],
        });
    });

    test('should emit write events for internally materialized cache entries', () => {
        class TestUser extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
                email: new Field<string>(),
            },
            { pkFieldName: 'id' }
        ) {}

        TestUser.cache.add({ id: 1, name: 'Bob', email: 'b@example.com' });
        __experimentalViewModelCacheDevtools.clear();

        expect(TestUser.cache.get(1, ['name'])).toBeTruthy();

        const firstPull = __experimentalViewModelCacheDevtools.pullEvents(0);
        expect(firstPull.events).toHaveLength(1);
        expect(firstPull.events[0]).toMatchObject({
            op: 'write',
            source: 'derived_get',
            isAllFields: false,
            presentNonRelationFieldNames: ['id', 'name'],
            missingNonRelationFieldNames: ['email'],
        });

        __experimentalViewModelCacheDevtools.clear();
        TestUser.cache.add({ id: 1, name: 'Bobby', email: 'bb@example.com' });
        const secondPull = __experimentalViewModelCacheDevtools.pullEvents(0);
        const writeSources = secondPull.events
            .filter(event => event.op === 'write')
            .map(event => (event as ViewModelWriteEvent).source)
            .sort();
        expect(writeSources).toEqual(['add', 'subset_fanout']);
    });

    test('should emit miss reason for unknown primary key', () => {
        class TestUser extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
            },
            { pkFieldName: 'id' }
        ) {}

        expect(TestUser.cache.get(999, ['name'])).toBe(null);

        const { events } = __experimentalViewModelCacheDevtools.pullEvents(0);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            modelName: 'TestUser',
            op: 'miss',
            pk: 999,
            reason: 'pk_not_cached',
            availableFieldSetKeys: [],
        });
    });

    test('should emit miss reason when field set is unavailable for known pk', () => {
        class TestUser extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
                email: new Field<string>(),
            },
            { pkFieldName: 'id' }
        ) {}

        TestUser.cache.add({ id: 1, name: 'Bob' });
        __experimentalViewModelCacheDevtools.clear();

        expect(TestUser.cache.get(1, ['email'])).toBe(null);

        const { events } = __experimentalViewModelCacheDevtools.pullEvents(0);
        const missEvent = events[0] as ViewModelMissEvent;
        expect(missEvent.reason).toBe('fields_not_cached_for_pk');
        expect(missEvent.availableFieldSetKeys.length).toBeGreaterThan(0);
    });

    test('should emit miss reason when related records are missing', () => {
        class Group extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
            },
            { pkFieldName: 'id' }
        ) {}

        class User extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
                groupId: new IntegerField({ blank: true }),
                group: new RelatedViewModelField({
                    to: Group,
                    sourceFieldName: 'groupId',
                }),
            },
            { pkFieldName: 'id' }
        ) {}

        User.cache.add({ id: 1, name: 'Bob', groupId: 123 });
        __experimentalViewModelCacheDevtools.clear();

        expect(User.cache.get(1, ['name', ['group', 'name']])).toBe(null);

        const { events } = __experimentalViewModelCacheDevtools.pullEvents(0);
        const missEvent = events.find(
            event => event.op === 'miss' && event.modelName === 'User'
        ) as ViewModelMissEvent;
        expect(missEvent.reason).toBe('related_records_missing');
        expect(missEvent.missingRelationPaths).toContain('group.name');
    });

    test('should return snapshot data for cached records', () => {
        class TestUserSnapshot extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
            },
            { pkFieldName: 'id' }
        ) {}

        TestUserSnapshot.cache.add({ id: 1, name: 'Bob' });

        const snapshot = __experimentalViewModelCacheDevtools.getSnapshot();
        const modelSnapshot = snapshot.models.find(
            model => model.modelName === 'TestUserSnapshot' && model.recordCount > 0
        );
        expect(modelSnapshot).toBeDefined();
        expect(modelSnapshot?.recordCount).toBe(1);
        expect(modelSnapshot?.records[0]).toMatchObject({
            pk: 1,
            fieldSets: [
                {
                    isAllFields: true,
                    value: { id: 1, name: 'Bob' },
                },
            ],
        });
    });

    test('should enforce max event retention', () => {
        class TestUser extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
            },
            { pkFieldName: 'id' }
        ) {}

        __experimentalViewModelCacheDevtools.enable({ maxEvents: 3 });
        __experimentalViewModelCacheDevtools.clear();

        TestUser.cache.add({ id: 1, name: 'one' });
        TestUser.cache.add({ id: 2, name: 'two' });
        TestUser.cache.add({ id: 3, name: 'three' });
        TestUser.cache.add({ id: 4, name: 'four' });

        const { events } = __experimentalViewModelCacheDevtools.pullEvents(0);
        expect(events).toHaveLength(3);
        expect(events[0].id).toBe(2);
        __experimentalViewModelCacheDevtools.enable({ maxEvents: 1000 });
    });

    test('should support cursor-based event polling', () => {
        class TestUser extends viewModelFactory(
            {
                id: new IntegerField(),
                name: new Field<string>(),
            },
            { pkFieldName: 'id' }
        ) {}

        TestUser.cache.add({ id: 1, name: 'one' });
        TestUser.cache.add({ id: 2, name: 'two' });

        const firstPull = __experimentalViewModelCacheDevtools.pullEvents(0);
        expect(firstPull.events).toHaveLength(2);

        const secondPull = __experimentalViewModelCacheDevtools.pullEvents(firstPull.cursor);
        expect(secondPull.events).toHaveLength(0);

        TestUser.cache.add({ id: 3, name: 'three' });
        const thirdPull = __experimentalViewModelCacheDevtools.pullEvents(secondPull.cursor);
        expect(thirdPull.events).toHaveLength(1);
        expect((thirdPull.events[0] as ViewModelDevtoolsEvent).id).toBe(thirdPull.cursor);
    });
});

describe('ViewModelCache devtools environment defaults', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
    });

    afterEach(() => {
        process.env = OLD_ENV;
    });

    test('should be disabled by default in production', () => {
        process.env.NODE_ENV = 'production';
        jest.isolateModules(() => {
            const { __experimentalViewModelCacheDevtools: devtools } =
                require('../devtools') as typeof import('../devtools');
            expect(devtools.isEnabled()).toBe(false);
        });
    });
});
