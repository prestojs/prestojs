import { isViewModelClass, ViewModelConstructor } from '@prestojs/viewmodel';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';

import { EndpointRequestInit, MiddlewareFunction, MiddlewareUrlConfig } from './Endpoint';

function cacheDataForModel<T extends ViewModelConstructor<any>>(model: T, data): T | T[] {
    if (Array.isArray(data)) {
        const records = data.map(datum => new model(datum));
        model.cache.addList(records);
        return records;
    }
    const record = new model(data);
    model.cache.add(record);
    return record;
}

type ViewModelMapping = ViewModelConstructor<any> | Record<string, ViewModelConstructor<any>>;
type ViewModelMappingDef = ViewModelMapping | (() => ViewModelMapping | Promise<ViewModelMapping>);

/**
 * Middleware to transform and cache a response
 *
 * The response is transformed & cached according to `viewModelMapping`.
 *
 * The simplest form of a mapping is to a Model:
 *
 * ```js
 * const middleware = [viewModelCachingMiddleware(User)];
 * const getUser = new Endpoint(new UrlPattern('/users/:id/'), { middleware });
 * ```
 *
 * If an element is a response is an array then it will transparently be treated as a list
 * of objects of the mapping type and the transformation function will be invoked for each
 * element one by one:
 *
 * ```js
 * const middleware = [viewModelCachingMiddleware(User)];
 * // Response is a single User instance:
 * const userRetrieve = new ViewModelEndpoint(new UrlPattern('/users/:id/'), { middleware });
 * // Response is an array of User instances
 * // (declaration is the same but the response handler will treat it differently)
 * const userList = new ViewModelEndpoint(new UrlPattern('/users/'), { middleware });
 * ```
 *
 * If the response is an object mapping different models you can specify how each
 * key is transformed. Each response value will be treated as an array/individual object
 * automatically:
 *
 * ```js
 * const middleware = viewModelCachingMiddleware({
 *     users: User,
 *     bookings: Booking,
 * });
 * ```
 *
 * Dot notation is also supported for nested objects (again each element may be a
 * single object or an array of objects)
 *
 * ```js
 * const middleware = viewModelCachingMiddleware({
 *     "records.users": User,
 *     "records.bookings": Booking,
 * });
 * ```
 *
 * The mapping can optionally be a function that returns a mapping or returns a promise that
 * resolves to a mapping. This is useful for dealing with dynamic imports or returning a class
 * that isn't yet defined.
 *
 * ```js
 * const middleware = paginationMiddleware(() => {
 *   const Booking = (await import('./Booking')).default;
 *   return {
 *     "records.users": User,
 *     "records.bookings": Booking,
 *   }
 * });
 * ```
 *
 * Each record instance created is also automatically added to the cache.
 *
 * NOTE: If using with [paginationMiddleware](doc:paginationMiddleware) then this must come
 * before `paginationMiddleware`.
 *
 * TODO: Convention for deleting an item?
 *
 * @extract-docs
 * @menu-group Middleware
 */
export default function viewModelCachingMiddleware<TReturn = any>(
    viewModelMapping: ViewModelMappingDef
): MiddlewareFunction<TReturn> {
    const cacheAndTransform = async (data: any): Promise<any> => {
        const _viewModelMapping =
            !isViewModelClass(viewModelMapping) && typeof viewModelMapping === 'function'
                ? await viewModelMapping()
                : viewModelMapping;
        if (isViewModelClass(_viewModelMapping)) {
            return cacheDataForModel(_viewModelMapping, data);
        }
        const transformed = cloneDeep(data);
        Object.entries(_viewModelMapping).forEach(([key, viewModel]) => {
            const value = get(data, key);
            if (value !== undefined) {
                set(transformed, key, cacheDataForModel(viewModel, value));
            }
        });
        return transformed;
    };

    return async (
        urlConfig: MiddlewareUrlConfig,
        requestInit: EndpointRequestInit,
        next: (urlConfig: MiddlewareUrlConfig, requestInit: RequestInit) => Promise<TReturn>
    ): Promise<TReturn> => {
        const response = await next(urlConfig, requestInit);
        return cacheAndTransform(response);
    };
}
