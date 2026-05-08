import {
    ViewModelDevtoolsEvent,
    ViewModelMissEvent,
    ViewModelWriteEvent,
} from '../shared/protocol';

export type EventOpFilter = 'all' | ViewModelDevtoolsEvent['op'];

export function appendEvents(
    existingEvents: ViewModelDevtoolsEvent[],
    incomingEvents: ViewModelDevtoolsEvent[],
    maxEvents = 1000
): ViewModelDevtoolsEvent[] {
    const byId = new Map<number, ViewModelDevtoolsEvent>();
    [...existingEvents, ...incomingEvents]
        .sort((a, b) => a.id - b.id)
        .forEach(event => byId.set(event.id, event));
    const combined = [...byId.values()];
    if (combined.length <= maxEvents) {
        return combined;
    }
    return combined.slice(combined.length - maxEvents);
}

export function filterEvents(
    events: ViewModelDevtoolsEvent[],
    modelFilter: string | 'all',
    opFilter: EventOpFilter
): ViewModelDevtoolsEvent[] {
    return events.filter(event => {
        if (modelFilter !== 'all' && event.modelName !== modelFilter) {
            return false;
        }
        if (opFilter !== 'all' && event.op !== opFilter) {
            return false;
        }
        return true;
    });
}

export function describeMiss(event: ViewModelMissEvent): string {
    if (event.reason === 'pk_not_cached') {
        return 'Primary key is not present in cache.';
    }
    if (event.reason === 'fields_not_cached_for_pk') {
        return 'Record exists for this primary key, but requested field set was not cached.';
    }
    return `Related records were missing for: ${
        (event.missingRelationPaths || []).join(', ') || 'unknown relation path'
    }.`;
}

export function describeWriteMissingFields(event: ViewModelWriteEvent): string {
    if (!event.missingNonRelationFieldNames) {
        return 'Missing fields: unavailable for this app build.';
    }
    if (event.missingNonRelationFieldNames.length === 0) {
        return 'Missing fields: none (all non-relation fields present).';
    }
    return `Missing fields: ${event.missingNonRelationFieldNames.join(', ')}`;
}

export function describeWriteSource(event: ViewModelWriteEvent): string {
    if (!event.source) {
        return 'Source: unknown (older bridge)';
    }
    if (event.source === 'add') {
        return 'Source: add';
    }
    if (event.source === 'subset_fanout') {
        return 'Source: subset fan-out';
    }
    if (event.source === 'derived_get') {
        return 'Source: derived via get';
    }
    return 'Source: relation sync';
}

export function prettyPrint(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch (error) {
        return String(value);
    }
}
