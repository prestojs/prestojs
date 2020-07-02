import { useUrlQueryState } from '@prestojs/routing';
import { useCallback } from 'react';
import { useCurrentRoute, useNavigation } from 'react-navi';

export default function useNaviUrlQueryState(initialState = {}, options = {}) {
    const { url } = useCurrentRoute();
    const navigation = useNavigation();
    const replaceUrl = useCallback(nextUrl => navigation.navigate(nextUrl, { replace: true }), [
        navigation,
    ]);
    return useUrlQueryState(initialState, {
        ...options,
        location: url,
        replaceUrl,
    });
}
