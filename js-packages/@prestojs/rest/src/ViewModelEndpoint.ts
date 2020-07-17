import { UrlPattern } from '@prestojs/routing';
import { isViewModelClass, ViewModelConstructor } from '@prestojs/viewmodel';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';

import Endpoint, { EndpointOptions } from './Endpoint';

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
 * Define an endpoint for a ViewModel. The response is transformed & cached according
 * to `viewModelMapping`.
 *
 * The simplest form of a mapping is to a Model:
 *
 * ```js
 * const getUser = new ViewModelEndpoint(new UrlPattern('/users/:id/'), User);
 * ```
 *
 * If an element is a response is an array then it will transparently be treated as a list
 * of objects of the mapping type and the transformation function will be invoked for each
 * element one by one:
 *
 * ```js
 * // Response is a single User instance:
 * const userRetrieve = new ViewModelEndpoint(new UrlPattern('/users/:id/'), User);
 * // Response is an array of User instances
 * // (declaration is the same but the response handler will treat it differently)
 * const userList = new ViewModelEndpoint(new UrlPattern('/users/'), User);
 * ```
 *
 * If the response is an object mapping different models you can specify how each
 * key is transformed. Each response value will be treated as an array/individual object
 * automatically:
 *
 * ```js
 * new ViewModelEndpoint(new UrlPattern('/users/'), {
 *     users: User,
 *     bookings: Booking,
 * });
 * ```
 *
 * Dot notation is also supported for nested objects (again each element may be a
 * single object or an array of objects)
 *
 * ```js
 * new ViewModelEndpoint(new UrlPattern('/users/'), {
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
 * new ViewModelEndpoint(new UrlPattern('/users/'), () => {
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
 * If the endpoint is paginated use [PaginatedViewModelEndpoint](doc:PaginatedViewModelEndpoint).
 *
 * TODO: Convention for deleting an item?
 *
 * @extract-docs
 */
export default class ViewModelEndpoint<ReturnT = any> extends Endpoint<ReturnT> {
    viewModelMapping: ViewModelMappingDef;
    constructor(
        urlPattern: UrlPattern,
        viewModelMapping: ViewModelMappingDef,
        options: EndpointOptions = {}
    ) {
        super(urlPattern, {
            ...options,
            transformResponseBody: (data: any): any => {
                if (options.transformResponseBody) {
                    data = options.transformResponseBody(data);
                }
                return this.cacheAndTransform(data);
            },
        });
        this.viewModelMapping = viewModelMapping;
    }

    async cacheAndTransform(data: any): Promise<any> {
        const viewModelMapping =
            !isViewModelClass(this.viewModelMapping) && typeof this.viewModelMapping === 'function'
                ? await this.viewModelMapping()
                : this.viewModelMapping;
        if (isViewModelClass(viewModelMapping)) {
            return cacheDataForModel(viewModelMapping, data);
        }
        const transformed = cloneDeep(data);
        Object.entries(viewModelMapping).forEach(([key, viewModel]) => {
            const value = get(data, key);
            if (value !== undefined) {
                set(transformed, key, cacheDataForModel(viewModel, value));
            }
        });
        return transformed;
    }
}
