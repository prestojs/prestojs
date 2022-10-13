/**
 * Paginate manually
 *
 * This example shows how to set up a paginator and manually call `setResponse`. In practice,
 * you would usually use [usePaginator](doc:usePaginator) and [paginationMiddleware](doc:paginationMiddleware),
 * but this shows you how things work internally.
 *
 * See the next example for the recommended usage.
 */
import { Endpoint } from '@prestojs/rest';
import { PageNumberPaginator, useAsync } from '@prestojs/util';
import { List, Pagination } from 'antd';
import 'antd/dist/antd.css';
import React, { useMemo, useState } from 'react';

const listEndpoint = new Endpoint('/api/pagination/page-number');

export default function PageNumberPaginatorManual() {
    const internalStatePair = useState({});
    const statePair = useState({});
    const paginator = useMemo(() => new PageNumberPaginator(statePair, internalStatePair), []);
    const { result, isLoading } = useAsync(
        listEndpoint.prepare({ query: paginator.currentState }),
        {
            trigger: 'SHALLOW',
            onSuccess(executeReturnVal) {
                // Here result is in the expected shape - if it wasn't you would transform it
                // e.g. paginator.setResponse({ nextPageNumber: result.next, previousPageNumber: result.previous });
                // Note that you can also call `PageNumberPaginator.getPaginationState(executeReturnVal)` and
                // it will extract the state from the `Execute` return value. This isn't necessary if you
                // are dealing with the `result` directly. See the documentation for `getPaginationState`
                // for more details.
                console.log(executeReturnVal.result);
                paginator.setResponse(executeReturnVal.result);
            },
        }
    );
    return (
        <List<{ id: number; name: string }>
            loading={isLoading}
            dataSource={result?.result?.results || []}
            renderItem={item => <List.Item key={item.id}>{item.name}</List.Item>}
            footer={
                <Pagination
                    total={paginator.total ?? 0}
                    onChange={(page, pageSize) => {
                        paginator.setPage(page);
                        paginator.setPageSize(pageSize);
                    }}
                />
            }
        />
    );
}
