/**
 * Store pagination state in the URL.
 *
 * This example is the same as the previous except it stores the state in the URL. This allows the page
 * to be restored on refresh.
 *
 * [Open the example](/examples/util/pagination/PageNumberPaginator/03-url-state) in a new window to see it
 * in action.
 */
import { Endpoint, paginationMiddleware, viewModelCachingMiddleware } from '@prestojs/rest';
import { useUrlQueryState } from '@prestojs/routing';
import { PageNumberPaginator, useAsync, usePaginator } from '@prestojs/util';
import { CharField, DateField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import { List, Pagination } from 'antd';
import 'antd/dist/antd.css';
import React from 'react';

class User extends viewModelFactory(
    { id: new IntegerField(), name: new CharField(), registeredOn: new DateField() },
    { pkFieldName: 'id' }
) {
    static endpoints = {
        list: new Endpoint<User[]>('/api/pagination/page-number', {
            middleware: [
                viewModelCachingMiddleware(User),
                paginationMiddleware(PageNumberPaginator),
            ],
        }),
    };
}

export default function PageNumberPaginatorUsePaginator() {
    const statePair = useUrlQueryState({});
    const paginator = usePaginator(User.endpoints.list, statePair) as PageNumberPaginator;
    // `result` is the list of users _without_ the pagination state. pagination state is available via the `paginator`.
    const { result, isLoading } = useAsync(User.endpoints.list.prepare({ paginator }), {
        trigger: 'SHALLOW',
    });
    return (
        <List<{ id: number; name: string }>
            loading={isLoading}
            dataSource={result?.result || []}
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
