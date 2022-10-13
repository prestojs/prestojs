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
import { CursorPaginator, useAsync, usePaginator } from '@prestojs/util';
import { CharField, DateField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import { Button, List, Space } from 'antd';
import 'antd/dist/antd.css';
import React from 'react';

class User extends viewModelFactory(
    { id: new IntegerField(), name: new CharField(), registeredOn: new DateField() },
    { pkFieldName: 'id' }
) {
    static endpoints = {
        list: new Endpoint<User[]>('/api/pagination/cursor', {
            middleware: [viewModelCachingMiddleware(User), paginationMiddleware(CursorPaginator)],
        }),
    };
}

export default function CursorPaginatorUsePaginator() {
    const paginator = usePaginator(User.endpoints.list) as CursorPaginator;
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
                <Space>
                    <Button
                        type="primary"
                        disabled={!paginator.hasPreviousPage()}
                        onClick={() => paginator.previous()}
                    >
                        Previous
                    </Button>
                    <Button
                        type="primary"
                        disabled={!paginator.hasNextPage()}
                        onClick={() => paginator.next()}
                    >
                        Next
                    </Button>
                </Space>
            }
        />
    );
}
