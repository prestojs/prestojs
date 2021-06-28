import Endpoint, {
    ApiError,
    defaultDecodeBody,
    EndpointRequestInit,
    MiddlewareContext,
    MiddlewareNextReturn,
    MiddlewareObject,
    MiddlewareReturn,
    MiddlewareUrlConfig,
    SkipToResponse,
} from './Endpoint';

type EndpointCall<T> = {
    urlConfig: MiddlewareUrlConfig;
    requestInit: EndpointRequestInit;
    context: MiddlewareContext<T>;
    resolvedUrl: string;
};

// Allow anything as a batch key - we store it in a `Map` so objects are valid. This allows
// you to use eg. the Endpoint itself as a key (eg. each endpoint forms it's own batch).
type BatchKey = any;

/**
 * @expand-properties
 */
type BatchMiddlewareOptions<BatchCallReturn, IndividualResult> = {
    /**
     * Get the key for this batch. Return false to exclude this call from being batched.
     *
     * If not provided a single batch will be generated.
     *
     * You can use this function to create different batches. All calls with the same batch key are batched together.
     */
    getBatchKey?: (call: EndpointCall<IndividualResult>) => false | BatchKey;
    /**
     * Execute the batch. This involves combining the individual calls into a single
     * call and then calling [fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch).
     *
     * This should return a Promise that resolves to a `Response` (eg. the return value of `fetch`).
     *
     * @param calls All the individual calls that are included in this batch
     */
    execute: (calls: EndpointCall<IndividualResult>[], batchKey: BatchKey) => Promise<Response>;
    /**
     * After `execute` has finished `resolve` is called for each endpoint call in the batch with the return value of execute
     * and should return the specific return value for that call. Whereas `execute` combines all the calls into a single
     * one `resolve` splits the response into the specific parts that each call requires (if applicable).
     *
     * @param call A specific call from the batch.
     * @param nextMiddlewareReturn The result returned from the next middleware in the chain. You can access the result
     * on the `result` key (this is the value that would be returned normally).
     * @param batchKey The key for the batch this call was in
     */
    resolve: (
        call: EndpointCall<IndividualResult>,
        nextMiddlewareReturn: MiddlewareNextReturn<BatchCallReturn>,
        batchKey: BatchKey
    ) => IndividualResult;
    /**
     * Called after `execute` has resolved if an error is thrown. This can either handle the
     * error and return the expected result or throw an another error.
     *
     * If not provided defaults to re-throwing the error.
     *
     * This is called for each endpoint call in the batch.
     *
     * @param call A specific call from the batch.
     * @param error The error created when `execute` either throws an error or when the returned response is not
     * successful.
     */
    reject?: (call: EndpointCall<IndividualResult>, error: ApiError) => IndividualResult;
    /**
     * Function used to decode the body of the response.
     *
     * If not provided defaults to
     * - If content-type includes 'json' (eg. application/json) returns decoded json
     * - If content-type includes 'text (eg. text/plain, text/html) returns text
     * - If status is 204 or 205 will return null
     * - Otherwise Response object itself is returned
     *
     * This does not use the `Endpoint` `decodeBody` as the `fetch` call itself is specific to the batching
     * and may not behave the same way. Batching could also happen across multiple different `Endpoint`s in which
     * case there would be multiple `decodeBody` functions to choose from.
     *
     * @param response The response object returned by [fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
     */
    decodeBody?: (response: Response) => any;
    /**
     * The time in ms to delay execution of a batch. During this period any calls made to the endpoint will be added to the
     * same batch. The delay begins as soon as the first item is added to the batch.
     *
     * The default is `10`
     */
    batchDelay?: number;
};

type QueueItem<T> = {
    call: EndpointCall<T>;
    resolveItem: (value: Response) => void;
};

class BatchMiddleware<BatchCallReturn, IndividualResult> {
    queueMap: Map<
        BatchKey,
        { isPending: boolean; queue: QueueItem<IndividualResult>[] }
    > = new Map();
    getBatchKey: (call: EndpointCall<IndividualResult>) => false | BatchKey;
    execute: (calls: EndpointCall<IndividualResult>[], batchKey: BatchKey) => Promise<Response>;
    resolve: (
        call: EndpointCall<IndividualResult>,
        nextMiddlewareReturn: MiddlewareNextReturn<BatchCallReturn>,
        batchKey: BatchKey
    ) => IndividualResult;
    reject: (call: EndpointCall<IndividualResult>, error: ApiError) => IndividualResult;
    decodeBody: (res: Response) => any;
    batchDelay: number;

    constructor(options: BatchMiddlewareOptions<BatchCallReturn, IndividualResult>) {
        const {
            getBatchKey = (): string => 'default',
            execute,
            resolve,
            reject = (call, error): IndividualResult => {
                throw error;
            },
            decodeBody = defaultDecodeBody,
            batchDelay = 10,
        } = options;
        this.batchDelay = batchDelay;
        this.getBatchKey = getBatchKey;
        this.execute = execute;
        this.resolve = resolve;
        this.reject = reject;
        this.decodeBody = decodeBody;
    }

    /**
     * Clear the queue for a batch key. This executes the call, decodes the body and resolves each
     * item in the queue to the `Response`. Control is then returned to the internal `Endpoint`
     * processing which will in turn yield control back to `process` (see after the `await next` call).
     */
    async clearQueue(batchKey: BatchKey): Promise<void> {
        const entry = this.queueMap.get(batchKey);
        if (!entry) {
            console.error(`Unexpected: no queue for ${batchKey}`);
            return;
        }
        const { queue } = entry;
        this.queueMap.set(batchKey, { isPending: false, queue: [] });
        // All items in queue have to be for same endpoint so we can just look at one of them to get the Endpoint instance
        const response = await this.execute(
            queue.map(({ call }) => call),
            batchKey
        );
        queue[0].call.context.markResponseDecoded(response, this.decodeBody(response));
        queue.map(({ resolveItem }) => {
            resolveItem(response);
        });
    }

    /**
     * Add an item to the queue for the specified batch. If it's the first item in a batch
     * it will `setTimeout` and call `clearQueue` after `batchDelay`.
     */
    enqueueCall(
        batchKey: string | number,
        call: EndpointCall<IndividualResult>
    ): Promise<Response> {
        return new Promise(resolveItem => {
            let entry = this.queueMap.get(batchKey);
            if (!entry) {
                entry = {
                    queue: [],
                    isPending: false,
                };
                this.queueMap.set(batchKey, entry);
            }
            entry.queue.push({ call, resolveItem });
            if (!entry.isPending) {
                entry.isPending = true;
                setTimeout(() => {
                    this.clearQueue(batchKey);
                }, this.batchDelay);
            }
        });
    }

    init(endpoint: Endpoint): void {
        const index = endpoint.middleware.indexOf(this);
        // The only middleware that can proceed batchMiddleware is another batchMiddleware
        for (let i = index; i < endpoint.middleware.length; i++) {
            if (!(endpoint.middleware[i] instanceof BatchMiddleware)) {
                throw new Error('batchMiddleware must appear last in the middleware chain');
            }
        }
    }
    async process(
        next,
        urlConfig: MiddlewareUrlConfig,
        requestInit: EndpointRequestInit,
        context: MiddlewareContext<IndividualResult>
    ): MiddlewareReturn<IndividualResult> {
        const resolvedUrl = context.endpoint.resolveUrl(
            urlConfig.pattern,
            urlConfig.args,
            urlConfig.query,
            urlConfig.baseUrl
        );
        const call = { urlConfig, requestInit, context, resolvedUrl };
        const batchKey = this.getBatchKey(call);
        if (batchKey === false) {
            return await next(urlConfig, requestInit);
        }

        try {
            const result = await next(new SkipToResponse(this.enqueueCall(batchKey, call)));
            return this.resolve(call, result, batchKey);
        } catch (error) {
            return this.reject(call, error);
        }
    }
}

/**
 * This can be used to batch together multiple calls to an endpoint (or endpoints) to make it more efficient.
 *
 * For example say you had an endpoint that accepted either 'id' or a list of 'ids' and would return the corresponding
 * records with those ids. For ease of use you could allow calling the endpoint with a body of `{ id: 2}` to get the
 * record of `id=2` but to minimise the number of requests you want to batch together any of these calls into a
 * combined body of `{ ids: [2, 4, 8] }` but still transparently return each individual record to the original caller
 * who requested it. This might look like:
 *
 * ```js
 * batchMiddleware({
 *     execute(calls) {
 *         // Our implementation of getBatchkey() guarantees that all the endpoints are the same URL (see below)
 *         const { resolvedUrl } = calls[0];
 *         // Extract the requested 'id' from each call
 *         const ids = calls.map(call => {
 *             return JSON.parse(call.requestInit.body as string).id;
 *         });
 *         // Call fetch, merge all other fetch options (headers etc) and create a
 *         // new body with all the extracted ids.
 *         return fetch(resolvedUrl, {
 *              // In this example all calls share the same headers etc
 *              ...calls[0].requestInit,
 *             body: JSON.stringify({ ids }),
 *         });
 *     },
 *     // You can also access `response` in addition to `result` if you need the raw `Response` object.
 *     resolve(call, { result }) {
 *         // For each call to the endpoint extract only the record it specifically request
 *         return result[JSON.parse(call.requestInit.body as string).id];
 *     },
 * })
 * ```
 *
 * But how do we distinguish between two completely different endpoints? `getBatchKey` can be used to determine how
 * calls are batched together:
 *
 * ```js
 * batchMiddleware({
 *   getBatchKey(call) {
 *     // Batch together all calls that have identical URL (including query parameters)
 *     return call.resolvedUrl;
 *   },
 *   ...
 * });
 * ```
 *
 * If each call has options to `fetch` that may differ then you can combine them using [mergeRequestInit](doc:mergeRequestInit).
 * This will combine multiple `init` arguments to [fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#parameters)
 * into a single `init` argument. Headers will be combined into a single headers object with the last argument taking
 * precedence in the case of a conflict. Any other `init` arguments use the value from the last argument passed.
 *
 * ```js
 * fetch(resolvedUrl, {
 *   ...mergeRequestInit(...calls.map(call => call.requestInit)),
 *   body: JSON.stringify({ ids }),
 * });
 * ```
 *
 * The process for batching looks like:
 *
 * * Endpoint is called like normal and hits `batchMiddleware`
 * * `options.getBatchKey` is called.
 *   * If this is `false` then the call proceeds to the next middleware in the chain.
 *   * If this returns anything else that is used as the batch key. If the batch already exist this call is added to the batch
 *     otherwise a new batch is created and it's execution is scheduled in `batchDelay` milliseconds. The `batchMiddleware`
 *     will then skip any further middleware in the chain and wait for the `fetch` call.
 * * Any further calls to an endpoint before the `batchDelay` time elapses are added to the batch
 * * Once `batchDelay` time elapses `execute` is called which combines all the batched calls into a single call to `fetch`
 *   * Once `fetch` finishes `decodeBody` is called.
 *   * `resolve` is then called on success (2xx status) or `reject` called on error (non-2xx status).
 * * The middleware stack continue to unwind and all middleware before `batchMiddleware` can handle the response/error
 *    returned by `resolve`/`reject`.
 *
 * > **NOTE**: You can have multiple `batchMiddleware` in the middleware chain for an `Endpoint` (including global
 * > middleware) but only one the first one that chooses to batch an item will ever apply (the others will be skipped).
 * > This allows you to have multiple conditional batching middleware for example. All `batchMiddleware` must appear
 * > last in the chain (ie. `batchingMiddleware` can only be proceeded by another `batchMiddleware`).
 *
 * @returns Middleware function to pass to [Endpoint](doc:Endpoint) or set on [Endpoint.defaultConfig.middleware](http://localhost:3000/docs/rest/Endpoint#static-var-defaultConfig)
 * @extract-docs
 * @menu-group Middleware
 * @return-type-name Middleware function
 */
export default function batchMiddleware<BatchCallReturn, IndividualResult>(
    options: BatchMiddlewareOptions<BatchCallReturn, IndividualResult>
): MiddlewareObject<IndividualResult> {
    return new BatchMiddleware<BatchCallReturn, IndividualResult>(options);
}
