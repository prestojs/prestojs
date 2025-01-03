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
import {
    CursorPaginator,
    InferredPaginator,
    LimitOffsetPaginator,
    PageNumberPaginator,
    useAsync,
    usePaginator,
} from '@prestojs/util';
import { CharField, DateField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import { Button, List, Radio, Space } from 'antd';
import 'antd/dist/antd.css';
import React, { useState } from 'react';

class User extends viewModelFactory(
    { id: new IntegerField(), name: new CharField(), registeredOn: new DateField() },
    { pkFieldName: 'id' }
) {
    static endpoints = {
        list: new Endpoint<User[]>('/api/pagination/:paginatorType', {
            middleware: [viewModelCachingMiddleware(User), paginationMiddleware(InferredPaginator)],
        }),
    };
}

function getPaginatorLabel(inferredPaginator: InferredPaginator) {
    const paginator = inferredPaginator.paginator;
    if (paginator instanceof LimitOffsetPaginator) {
        return 'LimitOffsetPaginator';
    }
    if (paginator instanceof CursorPaginator) {
        return 'CursorPaginator';
    }
    if (paginator instanceof PageNumberPaginator) {
        return 'PageNumberPaginator';
    }
    return '??';
}

function InferredPaginatorExample({
    paginatorType,
}: {
    paginatorType: 'page-number' | 'limit-offset' | 'cursor';
}) {
    const paginator = usePaginator(User.endpoints.list) as InferredPaginator;
    // `result` is the list of users _without_ the pagination state. pagination state is available via the `paginator`.
    const { result, isLoading } = useAsync(
        User.endpoints.list.prepare({ paginator, urlArgs: { paginatorType } }),
        {
            trigger: 'SHALLOW',
        }
    );
    return (
        <List<{ id: number; name: string }>
            loading={isLoading}
            dataSource={result?.result || []}
            renderItem={item => <List.Item key={item.id}>{item.name}</List.Item>}
            header={
                <>
                    <strong>Inferred class:</strong> {getPaginatorLabel(paginator)}
                </>
            }
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

export default function InferredPaginatorUsePaginatorExample() {
    const [paginatorType, setPaginatorType] = useState<'page-number' | 'limit-offset' | 'cursor'>(
        'page-number'
    );
    return (
        <Space direction="vertical">
            <Radio.Group
                options={[
                    { label: 'Page Number', value: 'page-number' },
                    { label: 'Limit/Offset', value: 'limit-offset' },
                    { label: 'Cursor', value: 'cursor' },
                ]}
                value={paginatorType}
                onChange={({ target: { value } }) => {
                    setPaginatorType(value);
                }}
                optionType="button"
                buttonStyle="solid"
            />
            <InferredPaginatorExample paginatorType={paginatorType} key={paginatorType} />
        </Space>
    );
}
