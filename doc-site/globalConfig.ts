import {
    Endpoint,
    EndpointRequestInit,
    MiddlewareContext,
    MiddlewareReturn,
    MiddlewareUrlConfig,
    SkipToResponse,
    ViewModelCachingMiddleware,
} from '@prestojs/rest';
import { isViewModelClass } from '@prestojs/viewmodel';

const localChanges: Record<string, any> = {};

/**
 * This intercepts calls to update user records and writes them to a local cache instead. These changes are then
 * re-applied whenever user data is fetched.
 *
 * Very hacky but just used for some examples.
 */
async function fakeSaveMiddleware<T>(
    next: (
        urlConfig: MiddlewareUrlConfig | SkipToResponse,
        requestInit?: RequestInit
    ) => Promise<T>,
    urlConfig: MiddlewareUrlConfig,
    requestInit: EndpointRequestInit,
    context: MiddlewareContext<T>
): MiddlewareReturn<T> {
    const cachingMiddleware = context.endpoint.middleware.find(
        m => m instanceof ViewModelCachingMiddleware
    ) as ViewModelCachingMiddleware<any> | undefined;
    if (!cachingMiddleware) {
        return next(urlConfig, requestInit);
    }
    const ViewModel = cachingMiddleware.viewModelMapping;
    if (!isViewModelClass(ViewModel)) {
        return next(urlConfig, requestInit);
    }

    if (
        requestInit.method === 'PATCH' &&
        urlConfig.pattern.pattern === '/api/user/:id' &&
        requestInit.body &&
        typeof requestInit.body === 'object'
    ) {
        const data = requestInit.body as Record<string, any>;
        localChanges[data.id] = data;
        ViewModel.cache.add(data);
        await new Promise(resolve => {
            setTimeout(resolve, 300);
        });
        return next(
            new SkipToResponse(
                new Promise(resolve => {
                    resolve(
                        new Response(JSON.stringify(requestInit.body), {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })
                    );
                })
            )
        );
    }
    const r = await next(urlConfig, requestInit);
    if (requestInit.method === 'GET' && urlConfig.pattern.pattern === '/api/paginated-users') {
        // @ts-ignore
        r.result = r.result.map(user => {
            if (localChanges[user.id]) {
                return ViewModel.cache.add(localChanges[user.id]);
            }
            return user;
        });
    }
    return r;
}

Endpoint.defaultConfig.middleware = [...Endpoint.defaultConfig.middleware, fakeSaveMiddleware];
