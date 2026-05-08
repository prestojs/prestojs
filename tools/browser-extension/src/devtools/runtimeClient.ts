import {
    VIEWMODEL_DEVTOOLS_REQUEST,
    ViewModelDevtoolsRequestMessage,
    ViewModelDevtoolsResponseMessage,
} from '../shared/messages';
import {
    BridgeMissingResponse,
    isBridgeMissingResponse,
    isPullEventsResult,
    isViewModelCacheSnapshot,
    PullEventsResult,
    ViewModelCacheSnapshot,
} from '../shared/protocol';

export type RuntimeClientResult<T> = { ok: true; value: T } | { ok: false; error: string };

function sendRequest(
    message: ViewModelDevtoolsRequestMessage
): Promise<RuntimeClientResult<unknown>> {
    return new Promise(resolve => {
        chrome.runtime.sendMessage(message, (response?: ViewModelDevtoolsResponseMessage) => {
            const runtimeError = chrome.runtime.lastError;
            if (runtimeError) {
                resolve({
                    ok: false,
                    error: runtimeError.message || 'Runtime messaging error',
                });
                return;
            }
            if (!response) {
                resolve({
                    ok: false,
                    error: 'No response returned from extension background bridge.',
                });
                return;
            }
            if (!response.ok) {
                resolve({
                    ok: false,
                    error: response.error || 'Unknown bridge error',
                });
                return;
            }
            resolve({
                ok: true,
                value: response.value,
            });
        });
    });
}

export async function fetchSnapshot(
    tabId: number
): Promise<RuntimeClientResult<ViewModelCacheSnapshot | BridgeMissingResponse>> {
    const result = await sendRequest({
        type: VIEWMODEL_DEVTOOLS_REQUEST,
        tabId,
        command: 'getSnapshot',
    });
    if (!result.ok) {
        return result;
    }
    if (isBridgeMissingResponse(result.value) || isViewModelCacheSnapshot(result.value)) {
        return {
            ok: true,
            value: result.value,
        };
    }
    return {
        ok: false,
        error: 'Unexpected snapshot payload returned from extension bridge.',
    };
}

export async function fetchEvents(
    tabId: number,
    cursor: number
): Promise<RuntimeClientResult<PullEventsResult | BridgeMissingResponse>> {
    const result = await sendRequest({
        type: VIEWMODEL_DEVTOOLS_REQUEST,
        tabId,
        command: 'pullEvents',
        cursor: Math.max(0, Math.floor(cursor)),
    });
    if (!result.ok) {
        return result;
    }
    if (isBridgeMissingResponse(result.value) || isPullEventsResult(result.value)) {
        return {
            ok: true,
            value: result.value,
        };
    }
    return {
        ok: false,
        error: 'Unexpected pullEvents payload returned from extension bridge.',
    };
}

export async function clearEvents(
    tabId: number
): Promise<RuntimeClientResult<boolean | BridgeMissingResponse>> {
    const result = await sendRequest({
        type: VIEWMODEL_DEVTOOLS_REQUEST,
        tabId,
        command: 'clear',
    });
    if (!result.ok) {
        return result;
    }
    if (isBridgeMissingResponse(result.value) || typeof result.value === 'boolean') {
        return {
            ok: true,
            value: result.value,
        };
    }
    return {
        ok: false,
        error: 'Unexpected clear payload returned from extension bridge.',
    };
}
