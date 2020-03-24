import { usePaginator } from '@prestojs/rest';
import { useCallback } from 'react';
import useSWR from 'swr';

/**
 * Wrapper around useSWR for use with `Endpoint`
 * @param action Endpoint to execute. Can be null if not yet ready to execute
 * @param args Any args to pass through to `prepare`
 * @return Object Same values as returned by useSWR with the addition of `execute` which
 * can be used to execute the action directly, optionally with new arguments.
 */
export default function useEndpoint(action, args, { paginationStatePair, ...config } = {}) {
    const paginator = usePaginator(action && action.getPaginatorClass(), paginationStatePair);
    const preparedAction = action ? action.prepare({ ...args, paginator }) : null;
    const execute = useCallback(init => preparedAction.execute(init), [preparedAction]);
    const result = useSWR(preparedAction && [preparedAction], act => act.execute({}), config);
    // We mutate this object as return var of useSWR is an object with getters that you lose
    // if you just spread the result
    // https://github.com/zeit/swr/issues/224
    result.execute = execute;
    result.paginator = paginator;
    return result;
}
