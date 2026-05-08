export type DevtoolsFieldPath = string | string[];

export type ViewModelCacheMissReason =
    | 'pk_not_cached'
    | 'fields_not_cached_for_pk'
    | 'related_records_missing';

export interface ViewModelCacheSnapshotEntry {
    fieldSetKey: string;
    isAllFields: boolean;
    normalizedFieldPaths: DevtoolsFieldPath[];
    value: unknown;
}

export interface ViewModelCacheRecordSnapshot {
    pk: unknown;
    fieldSets: ViewModelCacheSnapshotEntry[];
}

export interface ViewModelCacheModelSnapshot {
    modelName: string;
    recordCount: number;
    records: ViewModelCacheRecordSnapshot[];
}

export interface ViewModelCacheSnapshot {
    generatedAt: number;
    models: ViewModelCacheModelSnapshot[];
}

export interface ViewModelDevtoolsEventBase {
    id: number;
    ts: number;
    domain: 'viewmodel-cache';
    modelName: string;
    op: 'write' | 'delete' | 'deleteAll' | 'miss';
}

export type ViewModelWriteSource = 'add' | 'subset_fanout' | 'derived_get' | 'relation_sync';

export interface ViewModelWriteEvent extends ViewModelDevtoolsEventBase {
    op: 'write';
    pk: unknown;
    source?: ViewModelWriteSource;
    fieldSetKey: string;
    isAllFields: boolean;
    presentNonRelationFieldNames?: string[];
    missingNonRelationFieldNames?: string[];
    normalizedFieldPaths: DevtoolsFieldPath[];
    value: unknown;
}

export interface ViewModelDeleteEvent extends ViewModelDevtoolsEventBase {
    op: 'delete';
    pk: unknown;
    requestedFieldNames?: DevtoolsFieldPath[] | '*';
    normalizedFieldPaths?: DevtoolsFieldPath[];
}

export interface ViewModelDeleteAllEvent extends ViewModelDevtoolsEventBase {
    op: 'deleteAll';
    requestedFieldNames?: DevtoolsFieldPath[] | '*';
    normalizedFieldPaths?: DevtoolsFieldPath[];
}

export interface ViewModelMissEvent extends ViewModelDevtoolsEventBase {
    op: 'miss';
    pk: unknown;
    reason: ViewModelCacheMissReason;
    requestedFieldNames: DevtoolsFieldPath[] | '*';
    normalizedFieldPaths: DevtoolsFieldPath[];
    availableFieldSetKeys: string[];
    missingRelationPaths?: string[];
}

export type ViewModelDevtoolsEvent =
    | ViewModelWriteEvent
    | ViewModelDeleteEvent
    | ViewModelDeleteAllEvent
    | ViewModelMissEvent;

export interface PullEventsResult {
    cursor: number;
    events: ViewModelDevtoolsEvent[];
}

export interface BridgeMissingResponse {
    __prestoMissingBridge: true;
    message: string;
}

export function isBridgeMissingResponse(value: unknown): value is BridgeMissingResponse {
    return (
        Boolean(value) &&
        typeof value === 'object' &&
        (value as BridgeMissingResponse).__prestoMissingBridge === true
    );
}

export function isPullEventsResult(value: unknown): value is PullEventsResult {
    return (
        Boolean(value) &&
        typeof value === 'object' &&
        typeof (value as PullEventsResult).cursor === 'number' &&
        Array.isArray((value as PullEventsResult).events)
    );
}

export function isViewModelCacheSnapshot(value: unknown): value is ViewModelCacheSnapshot {
    return (
        Boolean(value) &&
        typeof value === 'object' &&
        typeof (value as ViewModelCacheSnapshot).generatedAt === 'number' &&
        Array.isArray((value as ViewModelCacheSnapshot).models)
    );
}
