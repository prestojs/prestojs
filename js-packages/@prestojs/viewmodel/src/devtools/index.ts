import { isDev } from '../util';
import type {
    ExperimentalViewModelCacheDevtools,
    PullEventsResult,
    ViewModelCacheDevtoolsAdapter,
    ViewModelCacheSnapshot,
    ViewModelDevtoolsEvent,
    ViewModelDevtoolsEventInput,
    ViewModelDevtoolsOptions,
} from './types';

const DEFAULT_MAX_EVENTS = 1000;

const cacheAdapters = new Set<ViewModelCacheDevtoolsAdapter>();
let events: ViewModelDevtoolsEvent[] = [];
let nextEventId = 0;
let maxEvents = DEFAULT_MAX_EVENTS;
let enabled = isDev();

function trimEvents(): void {
    if (events.length <= maxEvents) {
        return;
    }
    events.splice(0, events.length - maxEvents);
}

export function __registerViewModelCacheDevtoolsAdapter(
    adapter: ViewModelCacheDevtoolsAdapter
): void {
    cacheAdapters.add(adapter);
}

export function __emitViewModelDevtoolsEvent(event: ViewModelDevtoolsEventInput): void {
    if (!enabled) {
        return;
    }
    nextEventId += 1;
    const nextEvent: ViewModelDevtoolsEvent = {
        id: nextEventId,
        ts: Date.now(),
        domain: 'viewmodel-cache',
        ...event,
    };
    events.push(nextEvent);
    trimEvents();
}

export const __experimentalViewModelCacheDevtools: ExperimentalViewModelCacheDevtools = {
    enable(options?: ViewModelDevtoolsOptions): void {
        enabled = true;
        if (options && options.maxEvents != null) {
            maxEvents = Math.max(1, Math.floor(options.maxEvents));
        }
        trimEvents();
    },
    disable(): void {
        enabled = false;
    },
    isEnabled(): boolean {
        return enabled;
    },
    getSnapshot(): ViewModelCacheSnapshot {
        const models = [...cacheAdapters]
            .map(cache => cache.__experimentalDevtoolsGetSnapshot())
            .sort((a, b) => a.modelName.localeCompare(b.modelName));
        return {
            generatedAt: Date.now(),
            models,
        };
    },
    pullEvents(cursor = 0): PullEventsResult {
        const normalizedCursor = Number.isFinite(cursor) ? cursor : 0;
        const nextEvents = events.filter(event => event.id > normalizedCursor);
        const latestCursor =
            nextEvents.length > 0
                ? nextEvents[nextEvents.length - 1].id
                : normalizedCursor > 0 && events.length > 0
                ? events[events.length - 1].id
                : 0;
        return {
            cursor: latestCursor,
            events: nextEvents,
        };
    },
    clear(): void {
        events = [];
        nextEventId = 0;
    },
};

declare global {
    interface Window {
        __PRESTOJS_VIEWMODEL_DEVTOOLS__?: ExperimentalViewModelCacheDevtools;
    }
}

if (typeof window !== 'undefined') {
    window.__PRESTOJS_VIEWMODEL_DEVTOOLS__ = __experimentalViewModelCacheDevtools;
}

export type {
    DevtoolsDomain,
    DevtoolsFieldPath,
    ExperimentalViewModelCacheDevtools,
    PullEventsResult,
    ViewModelCacheModelSnapshot,
    ViewModelCacheMissReason,
    ViewModelCacheRecordSnapshot,
    ViewModelCacheSnapshot,
    ViewModelCacheSnapshotEntry,
    ViewModelDeleteAllEvent,
    ViewModelDeleteEvent,
    ViewModelDevtoolsEvent,
    ViewModelDevtoolsOptions,
    ViewModelMissEvent,
    ViewModelWriteSource,
    ViewModelWriteEvent,
} from './types';
