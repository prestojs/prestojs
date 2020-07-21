import { PaginatorInterfaceClass } from '@prestojs/util';
import ViewModelEndpoint from './ViewModelEndpoint';

/**
 * Extension of [ViewModelEndpoint](doc:ViewModelEndpoint) that provides a default paginator. This
 * can be customised globally in your project entry point (ie. it should happen before
 * any `Endpoint` is used):
 *
 * ```jsx
 * import { Endpoint } from '@prestojs/rest';
 *
 * Endpoint.defaultConfig.paginatorClass = MyCustomPaginator
 * ```
 *
 * The default is [InferredPaginator](doc:InferredPaginator) which will try to
 * infer the type of pagination in use based on the response.
 *
 * @menu-group Endpoint
 * @extract-docs
 */
export default class PaginatedViewModelEndpoint<ReturnT = any> extends ViewModelEndpoint<ReturnT> {
    /**
     * Returns the class to use for pagination as specified by `Endpoint.defaultConfig.paginatorClass`.
     *
     * Defaults to [InferredPaginator](doc:InferredPaginator)
     */
    getPaginatorClass(): PaginatorInterfaceClass<any> {
        const cls = Object.getPrototypeOf(this).constructor;
        return cls.defaultConfig.paginatorClass;
    }
}
