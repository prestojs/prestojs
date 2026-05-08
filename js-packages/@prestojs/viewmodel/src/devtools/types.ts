export type DevtoolsDomain = 'viewmodel-cache';

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
    domain: DevtoolsDomain;
    modelName: string;
    op: 'write' | 'delete' | 'deleteAll' | 'miss';
}

export type ViewModelWriteSource = 'add' | 'subset_fanout' | 'derived_get' | 'relation_sync';

export interface ViewModelWriteEvent extends ViewModelDevtoolsEventBase {
    op: 'write';
    pk: unknown;
    source: ViewModelWriteSource;
    fieldSetKey: string;
    isAllFields: boolean;
    presentNonRelationFieldNames: string[];
    missingNonRelationFieldNames: string[];
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

export type ViewModelDevtoolsEventInput = ViewModelDevtoolsEvent extends infer EventT
    ? EventT extends ViewModelDevtoolsEvent
        ? Omit<EventT, 'id' | 'ts' | 'domain'>
        : never
    : never;

export type ViewModelDevtoolsOptions = {
    maxEvents?: number;
};

export type PullEventsResult = {
    cursor: number;
    events: ViewModelDevtoolsEvent[];
};

export interface ExperimentalViewModelCacheDevtools {
    enable(options?: ViewModelDevtoolsOptions): void;
    disable(): void;
    isEnabled(): boolean;
    getSnapshot(): ViewModelCacheSnapshot;
    pullEvents(cursor?: number): PullEventsResult;
    clear(): void;
}

export interface ViewModelCacheDevtoolsAdapter {
    viewModel: {
        name: string;
    };
    __experimentalDevtoolsGetSnapshot(): ViewModelCacheModelSnapshot;
}
