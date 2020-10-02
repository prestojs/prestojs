import { isViewModelClass, PrimaryKey, ViewModelConstructor } from '@prestojs/viewmodel';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';

import Endpoint, {
    EndpointRequestInit,
    MiddlewareContext,
    MiddlewareObject,
    MiddlewareUrlConfig,
} from './Endpoint';

/**
 * Transform data into either a single instance of a ViewModel or an array of instances and cache them.
 *
 * The instance(s) of the ViewModel are then returned.
 */
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
 * @expand-properties
 */
type ViewModelCachingOptions<T> = {
    /**
     * A function to return the ID to used when a DELETE occurs. This id is used to remove the item with that ID
     * from the cache.
     *
     * Defaults to returning the url argument `id` (eg. from a UrlPattern like `/users/:id`).
     *
     * Specify this function if you use a different argument name or the ID is passed some other way (eg. in query string)
     *
     * @param context The middleware context.
     */
    getDeleteId?: (context: MiddlewareContext<T>) => PrimaryKey;
};

/**
 * Default function to get ID used on delete calls. Expects a URL arg called `id`, eg. `/users/:id`.
 */
function defaultGetDeleteId<T>(context: MiddlewareContext<T>): PrimaryKey {
    if (!context.executeOptions.urlArgs?.id) {
        throw new Error(
            "Expected 'id' argument for URL when handling DELETE. To customise this behaviour pass `getDeleteId` to `viewModelCachingMiddleware` for this Endpoint."
        );
    }
    return context.executeOptions.urlArgs.id;
}

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
 * @param viewModelMapping The mapping to use for caching as described above
 * @param options
 *
 * @extract-docs
 * @menu-group Middleware
 */
export default function viewModelCachingMiddleware<ReturnT = any>(
    viewModelMapping: ViewModelMappingDef,
    options: ViewModelCachingOptions<ReturnT> = {}
): MiddlewareObject<ReturnT> {
    const { getDeleteId = defaultGetDeleteId } = options;
    const resolveViewModelMapping = async (): Promise<ViewModelMapping> =>
        !isViewModelClass(viewModelMapping) && typeof viewModelMapping === 'function'
            ? viewModelMapping()
            : viewModelMapping;
    const cacheAndTransform = async (data: any): Promise<any> => {
        const _viewModelMapping = await resolveViewModelMapping();

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

    return {
        contributeToClass(endpoint: Endpoint): void {
            // When using the default implementation we can check things are setup correctly on initialisation and
            // throw an error. For custom implementations we have to wait until the method is called to do the check.
            if (getDeleteId === defaultGetDeleteId && endpoint.requestInit.method === 'DELETE') {
                if (!endpoint.urlPattern.requiredArgNames.includes('id')) {
                    throw new Error(
                        `When using 'viewModelCachingMiddleware' on a DELETE endpoint it is expected the UrlPattern includes an 'id' parameter. Known parameters are: ${endpoint.urlPattern.validArgNames.join(
                            ', '
                        )}. You can pass 'getDeleteId' to override this behavior.`
                    );
                }
            }
        },
        process: async (
            urlConfig: MiddlewareUrlConfig,
            requestInit: EndpointRequestInit,
            next: (urlConfig: MiddlewareUrlConfig, requestInit: RequestInit) => Promise<ReturnT>,
            context: MiddlewareContext<ReturnT>
        ): Promise<ReturnT> => {
            const response = await next(urlConfig, requestInit);
            if (context.requestInit.method?.toUpperCase() === 'DELETE') {
                const _viewModelMapping = await resolveViewModelMapping();
                if (!isViewModelClass(_viewModelMapping)) {
                    throw new Error(
                        'When handling DELETE the view model mapping must be a single ViewModelClass'
                    );
                }
                const id = getDeleteId(context);
                if (id == null || id === '') {
                    console.warn(
                        'Expected `getDeleteId` to return the id to use to remove the deleted item from the cache but nothing was returned.'
                    );
                } else {
                    _viewModelMapping.cache.delete(id);
                }
            }
            return cacheAndTransform(response);
        },
    };
}
