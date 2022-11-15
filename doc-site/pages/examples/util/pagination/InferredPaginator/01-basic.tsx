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
import {
    CursorPaginator,
    InferredPaginator,
    LimitOffsetPaginator,
    PageNumberPaginator,
    useAsync,
} from '@prestojs/util';
import { Button, List, Radio, Space } from 'antd';
import 'antd/dist/antd.css';
import React, { useMemo, useState } from 'react';

const pageNumberEndpoint = new Endpoint('/api/pagination/page-number');
const cursorEndpoint = new Endpoint('/api/pagination/cursor');
const limitOffsetEndpoint = new Endpoint('/api/pagination/limit-offset');

const endpointByType = {
    'page-number': pageNumberEndpoint,
    'limit-offset': limitOffsetEndpoint,
    cursor: cursorEndpoint,
};

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

export default function InferredPaginatorManual() {
    const [paginatorType, setPaginatorType] = useState<'page-number' | 'limit-offset' | 'cursor'>(
        'page-number'
    );
    const internalStatePair = useState({});
    const statePair = useState({});
    const paginator = useMemo(
        () => new InferredPaginator(statePair, internalStatePair),
        [paginatorType]
    );
    const { result, isLoading } = useAsync(
        endpointByType[paginatorType].prepare({ query: paginator.currentState }),
        {
            trigger: 'SHALLOW',
            onSuccess(executeReturnVal) {
                console.log(executeReturnVal.result);
                paginator.setResponse(executeReturnVal.result);
            },
        }
    );
    return (
        <List<{ id: number; name: string }>
            header={
                <Space direction="vertical">
                    <Radio.Group
                        options={[
                            { label: 'Page Number', value: 'page-number' },
                            { label: 'Limit/Offset', value: 'limit-offset' },
                            { label: 'Cursor', value: 'cursor' },
                        ]}
                        value={paginatorType}
                        onChange={({ target: { value } }) => {
                            statePair[1]({});
                            internalStatePair[1]({});
                            setPaginatorType(value);
                        }}
                        optionType="button"
                        buttonStyle="solid"
                    />
                    <span>
                        <strong>Inferred class:</strong> {getPaginatorLabel(paginator)}
                    </span>
                </Space>
            }
            loading={isLoading}
            dataSource={result?.result?.results || []}
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
