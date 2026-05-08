import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearEvents, fetchEvents, fetchSnapshot } from '../devtools/runtimeClient';
import {
    DevtoolsFieldPath,
    ViewModelCacheModelSnapshot,
    isBridgeMissingResponse,
    ViewModelCacheSnapshot,
    ViewModelDevtoolsEvent,
    ViewModelMissEvent,
    ViewModelWriteEvent,
} from '../shared/protocol';
import { bindNavigationReset, NavigatedEventsApi } from './navigation';
import {
    appendEvents,
    describeMiss,
    describeWriteMissingFields,
    describeWriteSource,
    EventOpFilter,
    filterEvents,
    prettyPrint,
} from './state';
import ObjectInspector from './ObjectInspector';

const POLL_INTERVAL_MS = 500;

const EMPTY_SNAPSHOT: ViewModelCacheSnapshot = {
    generatedAt: 0,
    models: [],
};

function formatTs(ts: number): string {
    return new Date(ts).toLocaleTimeString();
}

function formatFieldPath(path: DevtoolsFieldPath): string {
    if (Array.isArray(path)) {
        return path.join('.');
    }
    return path;
}

function formatFieldList(fieldPaths: DevtoolsFieldPath[], isAllFields = false): string {
    if (isAllFields) {
        return 'All fields';
    }
    if (fieldPaths.length === 0) {
        return '<none>';
    }
    return fieldPaths.map(formatFieldPath).join(', ');
}

function renderEventDetails(event: ViewModelDevtoolsEvent): string {
    if (event.op === 'write') {
        const writeEvent = event as ViewModelWriteEvent;
        return `PK ${prettyPrint(event.pk)} written (${formatFieldList(
            writeEvent.normalizedFieldPaths,
            writeEvent.isAllFields
        )}) | ${describeWriteSource(writeEvent)} | ${describeWriteMissingFields(writeEvent)}`;
    }
    if (event.op === 'delete') {
        return `PK ${prettyPrint(event.pk)} deleted`;
    }
    if (event.op === 'deleteAll') {
        return 'deleteAll invoked';
    }
    const miss = event as ViewModelMissEvent;
    return `${miss.reason}: ${describeMiss(miss)}`;
}

function snapshotForDisplay(
    snapshot: ViewModelCacheSnapshot | ViewModelCacheModelSnapshot
): unknown {
    if ('models' in snapshot) {
        return {
            ...snapshot,
            models: snapshot.models.map(snapshotForDisplay),
        };
    }
    return {
        ...snapshot,
        records: snapshot.records.map(record => ({
            ...record,
            fieldSets: record.fieldSets.map(fieldSet => ({
                ...fieldSet,
                fieldSetDisplay: formatFieldList(
                    fieldSet.normalizedFieldPaths,
                    fieldSet.isAllFields
                ),
            })),
        })),
    };
}

export default function App(): JSX.Element {
    const inspectedTabId: number | undefined =
        typeof chrome === 'undefined' ? undefined : chrome.devtools?.inspectedWindow?.tabId;
    const onNavigated: NavigatedEventsApi | undefined =
        typeof chrome === 'undefined' ? undefined : chrome.devtools?.network?.onNavigated;

    const [status, setStatus] = useState<'loading' | 'ready' | 'unsupported'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<ViewModelCacheSnapshot>(EMPTY_SNAPSHOT);
    const [events, setEvents] = useState<ViewModelDevtoolsEvent[]>([]);
    const [cursor, setCursor] = useState(0);
    const [modelFilter, setModelFilter] = useState<string | 'all'>('all');
    const [opFilter, setOpFilter] = useState<EventOpFilter>('all');
    const [isClearingTimeline, setIsClearingTimeline] = useState(false);

    const cursorRef = useRef(cursor);
    useEffect(() => {
        cursorRef.current = cursor;
    }, [cursor]);

    const resetLocalTimelineState = useCallback(() => {
        setEvents([]);
        setCursor(0);
        cursorRef.current = 0;
    }, []);

    const refreshSnapshot = useCallback(async () => {
        if (inspectedTabId == null) {
            setStatus('unsupported');
            setError('Unable to resolve inspected tab id.');
            return;
        }
        const result = await fetchSnapshot(inspectedTabId);
        if (!result.ok) {
            setStatus('unsupported');
            setError(result.error);
            return;
        }
        if (isBridgeMissingResponse(result.value)) {
            setStatus('unsupported');
            setError(result.value.message);
            return;
        }
        setSnapshot(result.value);
        setStatus('ready');
        setError(null);
    }, [inspectedTabId]);

    const pollEvents = useCallback(async () => {
        if (inspectedTabId == null) {
            setStatus('unsupported');
            setError('Unable to resolve inspected tab id.');
            return;
        }
        const result = await fetchEvents(inspectedTabId, cursorRef.current);
        if (!result.ok) {
            setStatus('unsupported');
            setError(result.error);
            return;
        }
        if (isBridgeMissingResponse(result.value)) {
            setStatus('unsupported');
            setError(result.value.message);
            return;
        }
        setStatus('ready');
        setError(null);
        setEvents(previous => appendEvents(previous, result.value.events));
        setCursor(result.value.cursor);
    }, [inspectedTabId]);

    const clearTimeline = useCallback(async () => {
        if (inspectedTabId == null) {
            setStatus('unsupported');
            setError('Unable to resolve inspected tab id.');
            return;
        }
        setIsClearingTimeline(true);
        try {
            const result = await clearEvents(inspectedTabId);
            if (!result.ok) {
                setStatus('unsupported');
                setError(result.error);
                return;
            }
            if (isBridgeMissingResponse(result.value)) {
                setStatus('unsupported');
                setError(result.value.message);
                return;
            }
            resetLocalTimelineState();
            setStatus('ready');
            setError(null);
            await refreshSnapshot();
        } finally {
            setIsClearingTimeline(false);
        }
    }, [inspectedTabId, refreshSnapshot, resetLocalTimelineState]);

    useEffect(() => {
        if (inspectedTabId == null) {
            setStatus('unsupported');
            setError('chrome.devtools.inspectedWindow.tabId is not available.');
            return;
        }

        refreshSnapshot();
        pollEvents();

        const intervalId = window.setInterval(() => {
            pollEvents();
        }, POLL_INTERVAL_MS);

        const unsubscribeNavigation = bindNavigationReset(onNavigated, () => {
            resetLocalTimelineState();
            refreshSnapshot();
        });

        return (): void => {
            window.clearInterval(intervalId);
            unsubscribeNavigation();
        };
    }, [inspectedTabId, onNavigated, pollEvents, refreshSnapshot, resetLocalTimelineState]);

    const filteredEvents = useMemo(
        () => filterEvents(events, modelFilter, opFilter),
        [events, modelFilter, opFilter]
    );

    const selectedModelSnapshot = useMemo(() => {
        if (modelFilter === 'all') {
            return null;
        }
        return snapshot.models.find(model => model.modelName === modelFilter) || null;
    }, [modelFilter, snapshot.models]);

    const snapshotValue = useMemo(
        () => snapshotForDisplay(selectedModelSnapshot || snapshot),
        [selectedModelSnapshot, snapshot]
    );

    const modelOptions = useMemo(
        () =>
            snapshot.models
                .map(model => ({
                    modelName: model.modelName,
                    recordCount: model.recordCount,
                }))
                .sort((a, b) => a.modelName.localeCompare(b.modelName)),
        [snapshot.models]
    );

    useEffect(() => {
        if (
            modelFilter !== 'all' &&
            !modelOptions.some(option => option.modelName === modelFilter)
        ) {
            setModelFilter('all');
        }
    }, [modelFilter, modelOptions]);

    return (
        <div className="app-shell">
            <header className="toolbar">
                <div>
                    <h1>Presto ViewModelCache</h1>
                    <p>Read-only inspector for cache snapshots and misses</p>
                </div>
                <div className="toolbar-actions">
                    <button onClick={refreshSnapshot}>Refresh Snapshot</button>
                    <button onClick={clearTimeline} disabled={isClearingTimeline}>
                        Clear Timeline
                    </button>
                </div>
            </header>

            <section className="filters">
                <label>
                    Model
                    <select
                        value={modelFilter}
                        onChange={event => setModelFilter(event.target.value)}
                    >
                        <option value="all">All models</option>
                        {modelOptions.map(option => (
                            <option key={option.modelName} value={option.modelName}>
                                {option.modelName} ({option.recordCount})
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Event
                    <select
                        value={opFilter}
                        onChange={event => setOpFilter(event.target.value as EventOpFilter)}
                    >
                        <option value="all">All events</option>
                        <option value="write">Write</option>
                        <option value="delete">Delete</option>
                        <option value="deleteAll">DeleteAll</option>
                        <option value="miss">Miss</option>
                    </select>
                </label>
                <div className="poll-status">Polling every {POLL_INTERVAL_MS}ms</div>
            </section>

            <section className={`status status-${status}`}>
                {status === 'loading' && <span>Connecting to inspected page...</span>}
                {status === 'ready' && (
                    <span>
                        Connected. Snapshot models: {snapshot.models.length}. Timeline events:{' '}
                        {events.length}.
                    </span>
                )}
                {status === 'unsupported' && (
                    <span>
                        Bridge unavailable. Ensure the page is running a dev build with
                        `__experimentalViewModelCacheDevtools`.
                    </span>
                )}
                {error && <code>{error}</code>}
            </section>

            <main className="content-grid">
                <section className="panel">
                    <h2>Event Timeline</h2>
                    {filteredEvents.length === 0 ? (
                        <p className="empty">No matching events yet.</p>
                    ) : (
                        <ul className="event-list">
                            {filteredEvents
                                .slice()
                                .reverse()
                                .map(event => (
                                    <li key={event.id} className={`event event-${event.op}`}>
                                        <div className="event-head">
                                            <span className="badge">{event.op}</span>
                                            <span>{event.modelName}</span>
                                            <time>{formatTs(event.ts)}</time>
                                        </div>
                                        <p>{renderEventDetails(event)}</p>
                                        {event.op === 'write' && (
                                            <details className="event-disclosure">
                                                <summary>Details</summary>
                                                <div className="event-inspector">
                                                    <ObjectInspector
                                                        label="writeDetails"
                                                        value={{
                                                            fieldSet: event.isAllFields
                                                                ? 'All fields'
                                                                : formatFieldList(
                                                                      event.normalizedFieldPaths
                                                                  ),
                                                            source: event.source || 'unknown',
                                                            presentNonRelationFieldNames:
                                                                event.presentNonRelationFieldNames ||
                                                                [],
                                                            missingNonRelationFieldNames:
                                                                event.missingNonRelationFieldNames,
                                                            value: event.value,
                                                        }}
                                                    />
                                                </div>
                                            </details>
                                        )}
                                        {event.op === 'miss' && (
                                            <details className="event-disclosure">
                                                <summary>Details</summary>
                                                <div className="event-inspector">
                                                    <ObjectInspector
                                                        label="missDetails"
                                                        value={{
                                                            requestedFieldNames:
                                                                event.requestedFieldNames === '*'
                                                                    ? 'All fields'
                                                                    : formatFieldList(
                                                                          event.requestedFieldNames
                                                                      ),
                                                            normalizedFieldPaths: formatFieldList(
                                                                event.normalizedFieldPaths
                                                            ),
                                                            availableFieldSetKeys:
                                                                event.availableFieldSetKeys,
                                                            missingRelationPaths:
                                                                event.missingRelationPaths || [],
                                                        }}
                                                    />
                                                </div>
                                            </details>
                                        )}
                                    </li>
                                ))}
                        </ul>
                    )}
                </section>
                <section className="panel">
                    <h2>Snapshot Inspector</h2>
                    {snapshot.models.length === 0 ? (
                        <p className="empty">No snapshot data available.</p>
                    ) : (
                        <div className="snapshot-inspector">
                            <ObjectInspector
                                label={
                                    selectedModelSnapshot
                                        ? selectedModelSnapshot.modelName
                                        : 'snapshot'
                                }
                                value={snapshotValue}
                            />
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
