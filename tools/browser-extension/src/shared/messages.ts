export type BridgeCommand = 'getSnapshot' | 'pullEvents' | 'clear';

export const VIEWMODEL_DEVTOOLS_REQUEST = 'PRESTO_VIEWMODEL_DEVTOOLS_REQUEST';

export interface ViewModelDevtoolsRequestMessage {
    type: typeof VIEWMODEL_DEVTOOLS_REQUEST;
    tabId: number;
    command: BridgeCommand;
    cursor?: number;
}

export interface ViewModelDevtoolsResponseMessage {
    ok: boolean;
    value?: unknown;
    error?: string;
}
