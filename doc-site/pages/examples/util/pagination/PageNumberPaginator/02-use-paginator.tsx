/**
 * Use with usePaginator & paginationMiddleware
 *
 * This example shows the standard usage of a paginator with `usePaginator` and an Endpoint with
 * `paginationMiddleware`.
 *
 * The big difference when using `paginationMiddleware` is that the `result` returned no longer includes
 * the pagination state - it only includes the records for that page. Pagination state is stored in the
 * `paginator` instead.
 */
import { Endpoint, paginationMiddleware, viewModelCachingMiddleware } from '@prestojs/rest';
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
    const paginator = usePaginator(User.endpoints.list) as PageNumberPaginator;
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
