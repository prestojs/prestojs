import {
    isViewModelClass,
    PrimaryKey,
    ViewModelConstructor,
    ViewModelInterface,
} from '@prestojs/viewmodel';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import Endpoint, {
    EndpointRequestInit,
    MiddlewareContext,
    MiddlewareNextReturn,
    MiddlewareUrlConfig,
} from './Endpoint';

import { PaginationMiddleware } from './paginationMiddleware';

function isPkSet(data: Record<string, any>, pkFieldName: string | string[]): boolean {
    if (Array.isArray(pkFieldName)) {
        return [pkFieldName.map(fieldName => fieldName in data)].every(Boolean);
    }
    return pkFieldName in data;
}

/**
 * Transform data into either a single instance of a ViewModel or an array of instances and cache them.
 *
 * The instance(s) of the ViewModel are then returned.
 */
function cacheDataForModel<T extends ViewModelConstructor<any, any>>(
    model: T,
    data
):
    | ViewModelInterface<T['fields'], T['pkFieldName']>
    | ViewModelInterface<T['fields'], T['pkFieldName']>[] {
    if (Array.isArray(data)) {
        const records = data.map(datum => new model(datum));
        model.cache.addList(records);
        return records as ViewModelInterface<T['fields'], T['pkFieldName']>[];
    }
    if (!isPkSet(data, model.pkFieldName)) {
        console.warn(
            `Data received by viewModelCachingMiddleware does not look a single record or list of records. If the data is nested under a key make sure you pass the mapping to 'viewModelCachingMiddleware'.

     * If the response is for a list of records check that it is an array. If the array is contained within a pagination envelope make sure the endpoint includes 'paginationMiddleware'.
     * If the response is for a single record check that you are including the primary key '${model.pkFieldName}' (there's no value for this in the returned data).

Data received: `,
            data
        );
    }

    const record = new model(data);
    model.cache.add(record);
    return record as ViewModelInterface<T['fields'], T['pkFieldName']>;
}

export type ViewModelMapping =
    | ViewModelConstructor<any, any>
    | Record<string, ViewModelConstructor<any, any>>;
/**
 * @expandproperties
 */
export type ViewModelMappingDef =
    | ViewModelMapping
    | (() => ViewModelMapping | Promise<ViewModelMapping>);

/**
 * A function with an optional `validateEndpoint` property.
 */
export interface GetDeleteId<T> {
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

    (context: MiddlewareContext<T>): PrimaryKey;

    /**
     * If specified, this function will be called when the endpoint is created to validate the endpoint.
     *
     * You can attach this as a property to the function:
     *
     * ```ts
     * function getDeleteId() { ...}
     * getDeleteId.validateEndpoint = endpoint => { ... }
     * ```
     *
     * @param endpoint The endpoint to validate
     */
    validateEndpoint?: (endpoint: Endpoint) => void;
}

/**
 * @expandproperties
 */
export type ViewModelCachingOptions<T> = {
    /**
     * A function to return the ID to used when a DELETE occurs. This id is used to remove the item with that ID
     * from the cache.
     *
     * Defaults to returning the url argument `id` (eg. from a UrlPattern like `/users/:id`).
     *
     * Specify this function if you use a different argument name or the ID is passed some other way (eg. in query string)
     *
     * The function can have an optional `validateEndpoint` property attached which should be a function that accepts the
     * `Endpoint` instance. This allows the function to validate the endpoint when it is created to eg. check that the
     * UrlPattern includes the expected argument name.
     *
     * @param context The middleware context.
     */
    getDeleteId?: GetDeleteId<T>;
    /**
     * By default, the mapping passed to `viewModelCacheMiddleware` is assumed to be the model to delete. In some
     * cases you may want to return additional data from an endpoint and need to define a more advanced mapping - in
     * these cases you can specify `deleteViewModel` as the model to delete and the mapping will be used to cache
     * the result.
     */
    deleteViewModel?:
        | ViewModelConstructor<any, any>
        | (() => ViewModelConstructor<any, any> | Promise<ViewModelConstructor<any, any>>);
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

defaultGetDeleteId.validateEndpoint = (endpoint: Endpoint): void => {
    if (!endpoint.urlPattern.requiredArgNames.includes('id')) {
        throw new Error(
            `When using 'viewModelCachingMiddleware' on a DELETE endpoint it is expected the UrlPattern includes an 'id' parameter. Known parameters are: ${endpoint.urlPattern.validArgNames.join(
                ', '
            )}. You can pass 'getDeleteId' to override this behavior.`
        );
    }
};

export class ViewModelCachingMiddleware<ReturnT> {
    deleteViewModel: ViewModelCachingOptions<ReturnT>['deleteViewModel'];
    getDeleteId: GetDeleteId<ReturnT>;
    viewModelMapping: ViewModelMappingDef;

    constructor(
        viewModelMapping: ViewModelMappingDef,
        options: ViewModelCachingOptions<ReturnT> = {}
    ) {
        const { getDeleteId = defaultGetDeleteId, deleteViewModel } = options;
        this.getDeleteId = getDeleteId;
        this.deleteViewModel = deleteViewModel;
        this.viewModelMapping = viewModelMapping;
    }

    async cacheAndTransform(data: any): Promise<any> {
        const _viewModelMapping = await this.resolveViewModelMapping(false);

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
    }

    async resolveViewModelMapping(forDelete: boolean): Promise<ViewModelMapping> {
        const mapping = (forDelete && this.deleteViewModel) || this.viewModelMapping;
        return !isViewModelClass(mapping) && typeof mapping === 'function' ? mapping() : mapping;
    }

    init(endpoint: Endpoint): void {
        // When using the default implementation we can check things are setup correctly on initialisation and
        // throw an error. For custom implementations we have to wait until the method is called to do the check.
        if (endpoint.requestInit.method === 'DELETE') {
            this.getDeleteId.validateEndpoint?.(endpoint);
        }
        const index = endpoint.middleware.indexOf(this);
        const paginationIndex = endpoint.middleware.findIndex(
            middleware => middleware instanceof PaginationMiddleware
        );
        if (paginationIndex !== -1 && paginationIndex < index) {
            throw new Error(
                `'paginationMiddleware' must come after 'viewModelCachingMiddleware', see endpoint ${endpoint.urlPattern.pattern}`
            );
        }
    }
    async process(
        next: (
            urlConfig: MiddlewareUrlConfig,
            requestInit: RequestInit
        ) => Promise<MiddlewareNextReturn<ReturnT>>,
        urlConfig: MiddlewareUrlConfig,
        requestInit: EndpointRequestInit,
        context: MiddlewareContext<ReturnT>
    ): Promise<ReturnT> {
        const { result } = await next(urlConfig, requestInit);
        if (context.requestInit.method?.toUpperCase() === 'DELETE') {
            const _viewModelMapping = await this.resolveViewModelMapping(true);
            if (!isViewModelClass(_viewModelMapping)) {
                throw new Error(
                    'When handling DELETE the view model mapping must be a single ViewModelClass. Use deleteViewModel if you need to update other models.'
                );
            }
            const id = this.getDeleteId(context);
            if (id == null || id === '') {
                console.warn(
                    'Expected `getDeleteId` to return the id to use to remove the deleted item from the cache but nothing was returned.'
                );
            } else {
                if (this.deleteViewModel) {
                    // Batch so listeners only notified once for all changes
                    return _viewModelMapping.cache.batch(() => {
                        const transformed = this.cacheAndTransform(result);
                        _viewModelMapping.cache.delete(id);
                        return transformed;
                    });
                }
                _viewModelMapping.cache.delete(id);
            }
            return (result || {}) as ReturnT;
        }
        return this.cacheAndTransform(result);
    }
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
 * const userRetrieve = new Endpoint(new UrlPattern('/users/:id/'), { middleware });
 * // Response is an array of User instances
 * // (declaration is the same but the response handler will treat it differently)
 * const userList = new Endpoint(new UrlPattern('/users/'), { middleware });
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
 * const middleware = viewModelCachingMiddleware(async () => {
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
 * Usually when deleting a model, the endpoint doesn't return anything. So by default if the endpoint method is DELETE
 * you should pass the model that will be deleted on a successful response.
 *
 * ```js
 * const middleware = [viewModelCachingMiddleware(User)];
 * // Response is empty:
 * const userDelete = new Endpoint(new UrlPattern('/users/:id/'), {
 *   middleware,
 *   method: "DELETE"
 * });
 * ```
 *
 * Sometimes a deletion will cause a related model to change and you might want to return the modified model data.
 * In order to do this you specify model to be deleted as the `deleteViewModel` and the model(s) to be updated as the
 * `viewModelMapping`. Note that if you provide a `viewModelMapping` that isn't a single model without providing the
 * deleteViewModel option, you will get an error.
 *
 * ```js
 * const middleware = [viewModelCachingMiddleware({"records.bookings": Booking}, {deleteViewModel: User})];
 * // Response would include the updated related bookings, with the number of diners reduced by 1
 * const updatedBookings = new Endpoint(new UrlPattern('/users/:id/'), {
 *   middleware,
 *   method: "DELETE"
 * });
 * ```
 *
 * NOTE: If using with [paginationMiddleware](doc:paginationMiddleware) then this must come
 * before `paginationMiddleware`.
 *
 * @param viewModelMapping The mapping to use for caching as described above. When the request method is `DELETE` this
 * is assumed to be the model that should be removed from the cache unless you provide `options.deleteViewModel`. If
 * `deleteViewModel` is provided then this value is used to cache the response of the delete call.
 * @param options
 *
 * @extractdocs
 * @menugroup Middleware
 */
export default function viewModelCachingMiddleware<ReturnT = any>(
    viewModelMapping: ViewModelMappingDef,
    options: ViewModelCachingOptions<ReturnT> = {}
): ViewModelCachingMiddleware<ReturnT> {
    return new ViewModelCachingMiddleware<ReturnT>(viewModelMapping, options);
}
