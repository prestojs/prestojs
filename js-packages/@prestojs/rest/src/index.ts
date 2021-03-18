export { default as Endpoint, ApiError } from './Endpoint';
export { default as viewModelCachingMiddleware } from './viewModelCachingMiddleware';
export { default as dedupeInFlightRequestsMiddleware } from './dedupeInFlightRequestsMiddleware';
export { default as paginationMiddleware } from './paginationMiddleware';
export { default as requestDefaultsMiddleware } from './requestDefaultsMiddleware';
export { default as detectBadPaginationMiddleware } from './detectBadPaginationMiddleware';

import type {
    EndpointExecuteOptions,
    ExecuteReturnVal,
    Middleware,
    MiddlewareContext,
    MiddlewareFunction,
    MiddlewareNextReturn,
    MiddlewareObject,
    MiddlewareReturn,
    MiddlewareUrlConfig,
} from './Endpoint';

export type {
    EndpointExecuteOptions,
    ExecuteReturnVal,
    Middleware,
    MiddlewareContext,
    MiddlewareFunction,
    MiddlewareNextReturn,
    MiddlewareObject,
    MiddlewareReturn,
    MiddlewareUrlConfig,
};
