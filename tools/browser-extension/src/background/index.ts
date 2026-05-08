import {
    VIEWMODEL_DEVTOOLS_REQUEST,
    ViewModelDevtoolsRequestMessage,
    ViewModelDevtoolsResponseMessage,
} from '../shared/messages';

function normalizeError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

async function executeBridgeCommand(
    tabId: number,
    command: 'getSnapshot' | 'pullEvents' | 'clear',
    cursor = 0
): Promise<unknown> {
    const executionResults = await chrome.scripting.executeScript({
        target: {
            tabId,
        },
        world: 'MAIN',
        func: (
            requestedCommand: 'getSnapshot' | 'pullEvents' | 'clear',
            requestedCursor: number
        ) => {
            const bridge = (
                window as Window & {
                    __PRESTOJS_VIEWMODEL_DEVTOOLS__?: {
                        getSnapshot(): unknown;
                        pullEvents(cursor: number): unknown;
                        clear(): void;
                    };
                }
            ).__PRESTOJS_VIEWMODEL_DEVTOOLS__;
            if (!bridge) {
                return {
                    __prestoMissingBridge: true,
                    message: 'Presto ViewModelCache devtools bridge was not found on window.',
                };
            }
            if (requestedCommand === 'getSnapshot') {
                return bridge.getSnapshot();
            }
            if (requestedCommand === 'clear') {
                bridge.clear();
                return true;
            }
            return bridge.pullEvents(requestedCursor);
        },
        args: [command, Math.max(0, Math.floor(cursor))],
    });
    return executionResults[0]?.result;
}

chrome.runtime.onMessage.addListener(
    (
        message: ViewModelDevtoolsRequestMessage,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: ViewModelDevtoolsResponseMessage) => void
    ): boolean | void => {
        if (!message || message.type !== VIEWMODEL_DEVTOOLS_REQUEST) {
            return;
        }
        executeBridgeCommand(message.tabId, message.command, message.cursor)
            .then(result => {
                sendResponse({
                    ok: true,
                    value: result,
                });
            })
            .catch(error => {
                sendResponse({
                    ok: false,
                    error: normalizeError(error),
                });
            });
        return true;
    }
);
