import { ViewModelDevtoolsEvent, ViewModelMissEvent } from '../shared/protocol';
import {
    appendEvents,
    describeMiss,
    describeWriteMissingFields,
    describeWriteSource,
    filterEvents,
} from './state';

const BASE_EVENT = {
    ts: 1,
    domain: 'viewmodel-cache' as const,
};

describe('panel state helpers', () => {
    test('appendEvents should deduplicate by id and preserve ascending order', () => {
        const existing: ViewModelDevtoolsEvent[] = [
            {
                ...BASE_EVENT,
                id: 1,
                modelName: 'User',
                op: 'write',
                pk: 1,
                fieldSetKey: 'id',
                isAllFields: false,
                normalizedFieldPaths: ['id'],
                value: { id: 1 },
            },
        ];
        const incoming: ViewModelDevtoolsEvent[] = [
            {
                ...BASE_EVENT,
                id: 1,
                modelName: 'User',
                op: 'write',
                pk: 1,
                fieldSetKey: 'id',
                isAllFields: false,
                normalizedFieldPaths: ['id'],
                value: { id: 1 },
            },
            {
                ...BASE_EVENT,
                id: 2,
                modelName: 'User',
                op: 'delete',
                pk: 1,
            },
        ];

        const next = appendEvents(existing, incoming);
        expect(next.map(event => event.id)).toEqual([1, 2]);
    });

    test('filterEvents should apply model and operation filters', () => {
        const events: ViewModelDevtoolsEvent[] = [
            {
                ...BASE_EVENT,
                id: 1,
                modelName: 'User',
                op: 'write',
                pk: 1,
                fieldSetKey: 'id',
                isAllFields: false,
                normalizedFieldPaths: ['id'],
                value: { id: 1 },
            },
            {
                ...BASE_EVENT,
                id: 2,
                modelName: 'Group',
                op: 'miss',
                pk: 1,
                reason: 'pk_not_cached',
                requestedFieldNames: ['id'],
                normalizedFieldPaths: ['id'],
                availableFieldSetKeys: [],
            },
        ];

        expect(filterEvents(events, 'User', 'all')).toHaveLength(1);
        expect(filterEvents(events, 'all', 'miss')).toHaveLength(1);
        expect(filterEvents(events, 'User', 'miss')).toHaveLength(0);
    });

    test('describeMiss should explain each miss reason', () => {
        const miss: ViewModelMissEvent = {
            ...BASE_EVENT,
            id: 10,
            modelName: 'User',
            op: 'miss',
            pk: 1,
            reason: 'related_records_missing',
            requestedFieldNames: ['group'],
            normalizedFieldPaths: ['groupId', ['group', 'id']],
            availableFieldSetKeys: ['id⁞groupId'],
            missingRelationPaths: ['group.id'],
        };
        expect(describeMiss(miss)).toContain('group.id');
    });

    test('describeWriteMissingFields should include missing field names', () => {
        expect(
            describeWriteMissingFields({
                ...BASE_EVENT,
                id: 11,
                modelName: 'User',
                op: 'write',
                pk: 1,
                fieldSetKey: 'id⁞name',
                isAllFields: false,
                presentNonRelationFieldNames: ['id', 'name'],
                missingNonRelationFieldNames: ['email'],
                normalizedFieldPaths: ['id', 'name'],
                value: { id: 1, name: 'Bob' },
            })
        ).toContain('email');
        expect(
            describeWriteMissingFields({
                ...BASE_EVENT,
                id: 12,
                modelName: 'User',
                op: 'write',
                pk: 1,
                fieldSetKey: 'id⁞name⁞email',
                isAllFields: true,
                presentNonRelationFieldNames: ['id', 'name', 'email'],
                missingNonRelationFieldNames: [],
                normalizedFieldPaths: ['id', 'name', 'email'],
                value: { id: 1, name: 'Bob', email: 'bob@example.com' },
            })
        ).toContain('none');
        expect(
            describeWriteMissingFields({
                ...BASE_EVENT,
                id: 13,
                modelName: 'User',
                op: 'write',
                pk: 1,
                fieldSetKey: 'id⁞name',
                isAllFields: false,
                normalizedFieldPaths: ['id', 'name'],
                value: { id: 1, name: 'Bob' },
            })
        ).toContain('unavailable');
    });

    test('describeWriteSource should explain write sources', () => {
        expect(
            describeWriteSource({
                ...BASE_EVENT,
                id: 20,
                modelName: 'User',
                op: 'write',
                source: 'add',
                pk: 1,
                fieldSetKey: 'id',
                isAllFields: false,
                normalizedFieldPaths: ['id'],
                value: { id: 1 },
            })
        ).toContain('add');
        expect(
            describeWriteSource({
                ...BASE_EVENT,
                id: 21,
                modelName: 'User',
                op: 'write',
                source: 'derived_get',
                pk: 1,
                fieldSetKey: 'id⁞name',
                isAllFields: false,
                normalizedFieldPaths: ['id', 'name'],
                value: { id: 1, name: 'Bob' },
            })
        ).toContain('derived');
        expect(
            describeWriteSource({
                ...BASE_EVENT,
                id: 22,
                modelName: 'User',
                op: 'write',
                pk: 1,
                fieldSetKey: 'id',
                isAllFields: false,
                normalizedFieldPaths: ['id'],
                value: { id: 1 },
            })
        ).toContain('unknown');
    });
});
