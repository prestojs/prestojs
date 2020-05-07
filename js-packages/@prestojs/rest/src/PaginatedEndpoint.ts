import Endpoint from './Endpoint';
import { PaginatorInterface, PaginatorInterfaceClass } from './Paginator';

/**
 * Extension of [Endpoint](doc:Endpoint) that provides a default paginator. This
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
 * @extract-docs
 */
export default class PaginatedEndpoint<
    ReturnT = any,
    PaginatorT extends PaginatorInterface = PaginatorInterface
> extends Endpoint<ReturnT, PaginatorT> {
    /**
     * Returns the class to use for pagination as specified by `Endpoint.defaultConfig.paginatorClass`.
     *
     * Defaults to [InferredPaginator](doc:InferredPaginator)
     */
    getPaginatorClass(): PaginatorInterfaceClass<PaginatorT> {
        const cls = Object.getPrototypeOf(this).constructor;
        return cls.defaultConfig.paginatorClass;
    }
}
