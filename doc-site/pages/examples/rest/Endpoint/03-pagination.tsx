/**
 * Integrating pagination
 *
 * This example uses [paginationMiddleware](doc:paginationMiddleware) to handle paginated responses
 * and [usePaginator](doc:usePaginator) to create a paginator to use with endpoint.
 * When the `pagination` or `query` arguments to `endpoint.prepare` changes `prepare` will return a
 * new function which `useAsync` will call.
 */
import { Endpoint, paginationMiddleware } from '@prestojs/rest';
import { PageNumberPaginator, useAsync, usePaginator } from '@prestojs/util';
import { Input, Pagination } from 'antd';
import 'antd/dist/antd.css';
import React from 'react';

const endpoint = new Endpoint<{ id: number; name: string }[]>('/api/paginated-users', {
    middleware: [paginationMiddleware()],
});

export default function PaginationExample() {
    const [filter, setFilter] = React.useState('');
    const paginator = usePaginator(endpoint) as PageNumberPaginator;
    const { result, isLoading } = useAsync(endpoint.prepare({ query: { filter }, paginator }), {
        trigger: 'SHALLOW',
    });
    const onSearch = ({ target: { value } }) => {
        // When filter changes the paginator should reset to page 1 as it's
        // a new dataset
        paginator.setPage(1);
        setFilter(value);
    };
    return (
        <div>
            <Input
                disabled={isLoading}
                type="search"
                placeholder="Search"
                // @ts-ignore
                onPressEnter={onSearch}
                onBlur={onSearch}
                style={{ maxWidth: 300 }}
            />
            {result?.result.map(user => (
                <div key={user.id}>{user.name}</div>
            ))}
            <Pagination
                current={paginator.page || 1}
                pageSize={paginator.pageSize || 10}
                onChange={(page, pageSize) => {
                    paginator.setPage(page);
                    paginator.setPageSize(pageSize);
                }}
                total={paginator.total || 0}
            />
        </div>
    );
}
