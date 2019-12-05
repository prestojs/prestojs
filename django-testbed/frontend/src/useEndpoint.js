import { useCallback } from 'react';
import useSWR from 'swr';

/**
 * Wrapper around useSWR for use with `Endpoint`
 * @param action Endpoint to execute. Can be null if not yet ready to execute
 * @param args Any args to pass through to `prepare`
 * @return Object Same values as returned by useSWR with the addition of `execute` which
 * can be used to execute the action directly, optionally with new arguments.
 */
export default function useEndpoint(action, args) {
    const preparedAction = action ? action.prepare(args) : null;
    const execute = useCallback(init => preparedAction.execute(init), [preparedAction]);
    return {
        execute,
        ...useSWR(preparedAction && [preparedAction], act => act.execute({})),
    };
}
