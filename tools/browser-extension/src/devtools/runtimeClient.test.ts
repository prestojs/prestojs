import { VIEWMODEL_DEVTOOLS_REQUEST } from '../shared/messages';
import { clearEvents, fetchEvents, fetchSnapshot } from './runtimeClient';

describe('runtimeClient', () => {
    afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (global as any).chrome;
    });

    test('should fetch snapshot via runtime messaging', async () => {
        const sendMessage = jest.fn((_message, callback) => {
            callback({
                ok: true,
                value: {
                    generatedAt: 1,
                    models: [],
                },
            });
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).chrome = {
            runtime: {
                sendMessage,
                lastError: undefined,
            },
        };

        const result = await fetchSnapshot(77);
        expect(result).toEqual({
            ok: true,
            value: {
                generatedAt: 1,
                models: [],
            },
        });
        expect(sendMessage).toHaveBeenCalledWith(
            {
                type: VIEWMODEL_DEVTOOLS_REQUEST,
                tabId: 77,
                command: 'getSnapshot',
            },
            expect.any(Function)
        );
    });

    test('should fetch events with normalized cursor', async () => {
        const sendMessage = jest.fn((_message, callback) => {
            callback({
                ok: true,
                value: {
                    cursor: 5,
                    events: [],
                },
            });
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).chrome = {
            runtime: {
                sendMessage,
                lastError: undefined,
            },
        };

        await fetchEvents(12, -5.3);
        expect(sendMessage).toHaveBeenCalledWith(
            {
                type: VIEWMODEL_DEVTOOLS_REQUEST,
                tabId: 12,
                command: 'pullEvents',
                cursor: 0,
            },
            expect.any(Function)
        );
    });

    test('should return runtime errors', async () => {
        const runtime = {
            sendMessage: jest.fn((_message, callback) => {
                runtime.lastError = { message: 'No receiver' };
                callback(undefined);
            }),
            lastError: undefined as { message: string } | undefined,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).chrome = {
            runtime,
        };

        const result = await fetchSnapshot(1);
        expect(result).toEqual({
            ok: false,
            error: 'No receiver',
        });
    });

    test('should clear events through runtime bridge', async () => {
        const sendMessage = jest.fn((_message, callback) => {
            callback({
                ok: true,
                value: true,
            });
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).chrome = {
            runtime: {
                sendMessage,
                lastError: undefined,
            },
        };

        const result = await clearEvents(91);
        expect(result).toEqual({
            ok: true,
            value: true,
        });
        expect(sendMessage).toHaveBeenCalledWith(
            {
                type: VIEWMODEL_DEVTOOLS_REQUEST,
                tabId: 91,
                command: 'clear',
            },
            expect.any(Function)
        );
    });
});
