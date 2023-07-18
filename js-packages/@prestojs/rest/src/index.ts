export { default as Endpoint, ApiError, mergeRequestInit, SkipToResponse } from './Endpoint';
export {
    default as viewModelCachingMiddleware,
    ViewModelCachingMiddleware,
} from './viewModelCachingMiddleware';
export { default as dedupeInFlightRequestsMiddleware } from './dedupeInFlightRequestsMiddleware';
export { default as paginationMiddleware, PaginationMiddleware } from './paginationMiddleware';
export { default as requestDefaultsMiddleware } from './requestDefaultsMiddleware';
export { default as detectBadPaginationMiddleware } from './detectBadPaginationMiddleware';
export { default as batchMiddleware } from './batchMiddleware';

export type { BatchMiddlewareOptions } from './batchMiddleware';

export type { DedupeOptions } from './dedupeInFlightRequestsMiddleware';
export type { PaginationMiddlewareOptions } from './paginationMiddleware';
export type {
    ViewModelCachingOptions,
    GetDeleteId,
    ViewModelMappingDef,
    ViewModelMapping,
} from './viewModelCachingMiddleware';

export type {
    DefaultConfig,
    EndpointExecuteOptions,
    EndpointOptions,
    EndpointRequestInit,
    ExecuteInitOptions,
    ExecuteReturnVal,
    Middleware,
    MiddlewareContext,
    MiddlewareFunction,
    MiddlewareNextFunction,
    MiddlewareNextReturn,
    MiddlewareObject,
    MiddlewareReturn,
    MiddlewareUrlConfig,
    PreparedEndpoint,
} from './Endpoint';
