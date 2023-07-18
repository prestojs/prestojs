/**
 * Advanced usage with useAsyncChoices
 *
 * This example shows how to use `useAsyncChoices` to create a custom widget for interacting with the choices. It
 * also uses `useResolveItems` to resolve choices from a ViewModelCache. You can select items on the left and the
 * current selection will appear on the right. You can modify the items on the right and the changes will reflect
 * in both lists, because the values are being written and read from the cache.
 *
 *
 * @wide
 */
import { EditOutlined } from '@ant-design/icons';
import { Endpoint, paginationMiddleware, viewModelCachingMiddleware } from '@prestojs/rest';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { PageNumberPaginator, useAsync, usePaginator } from '@prestojs/util';
import {
    AsyncChoices,
    CharField,
    DateField,
    IntegerField,
    useAsyncChoices,
    useViewModelCache,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { Button, Input, List, Table } from 'antd';
import 'antd/dist/antd.min.css';
import orderBy from 'lodash/orderBy';
import React, { useState } from 'react';

/**
 * Define the ViewModel to use with endpoints for listing & updating records
 *
 * We use the cache extensively for this example.
 */
class User extends viewModelFactory(
    { id: new IntegerField(), name: new CharField(), registeredOn: new DateField() },
    { pkFieldName: 'id' }
) {
    static endpoints = {
        list: new Endpoint<User[]>('/api/paginated-users', {
            middleware: [viewModelCachingMiddleware(User), paginationMiddleware()],
        }),
        update: new Endpoint<User>('/api/user/:id', {
            method: 'PATCH',
            middleware: [viewModelCachingMiddleware(User)],
        }),
    };
}

const asyncChoices = new AsyncChoices<User, number>({
    multiple: true,
    useListProps: () => {
        // Note that this is passed `query` and `listOptions`. You can pass through `listOptions` to
        // `SelectAsyncChoicesWidget` below (or `useAsyncChoices` if you're using it directly).
        const paginator = usePaginator(PageNumberPaginator);
        return {
            paginator,
            // any other values you return here will be available in `list` below
        };
    },
    /**
     * This is called when the dropdown is opened  and retrieves the items to display
     */
    async list({ query = {}, listOptions = {}, paginator }) {
        // `query` comes from `SelectAsyncChoicesWidget` and can contain `keywords` when filtering the list
        // `listOptions` can be passed through to `SelectAsyncChoicesWidget` or `useAsyncChoices`.
        // `paginator` comes from `useListProps`. You can also return other values from `useListProps` and they
        // will be available here.
        return (
            await User.endpoints.list.execute({
                query: {
                    ...query,
                    ...listOptions.query,
                },
                paginator,
            })
        ).result;
    },
    /**
     * This is called when a value needs to be resolved, for example if a value has been selected previously
     *
     * Note that you can also implement `useRetrieveProps` if you need to pass additional values that need to interact
     * with React (for example is you need to use `useState` or other hooks).
     */
    async retrieve(value: number[], deps): Promise<User[]> {
        return (
            (
                await User.endpoints.list.execute({
                    query: {
                        ids: value,
                    },
                    ...deps,
                })
            ).result || []
        );
    },
    /**
     * Read the value from the cache so that any changes made to the item are reflected in the UI
     */
    useResolveItems<T extends User | User[] | null>(item: T): T {
        return useViewModelCache(User, cache =>
            item ? (Array.isArray(item) ? cache.getList(item) : cache.get(item)) : item
        ) as T;
    },
    getLabel(item: User) {
        return item.name;
    },
    getValue(item: User) {
        return item.id;
    },
});

export default function FormUsage() {
    const [keywords, setKeywords] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
    const { list, choices, selected } = useAsyncChoices({
        asyncChoices,
        value: selectedKeys,
        query: { keywords },
    });
    /**
     * useAsync hook for triggering the save on user.
     */
    const { run: saveUser, isLoading: isUpdating } = useAsync(
        data => User.endpoints.update.execute({ body: data, urlArgs: { id: data.id } }),
        {
            onSuccess() {
                setEditId(null);
            },
        }
    );
    const paginator = list.paginator as PageNumberPaginator;
    return (
        <React.Suspense fallback="Loading...">
            <AntdUiProvider
                getWidgetForField={getWidgetForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <div style={{ display: 'flex', gap: 20 }}>
                    <Table<{ value: number; label: string }>
                        style={{ flex: 1 }}
                        rowKey="value"
                        dataSource={choices as { value: number; label: string }[]}
                        columns={[
                            {
                                title: (
                                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                        Name{' '}
                                        <Input.Search
                                            allowClear
                                            placeholder="Search users"
                                            onSearch={value => setKeywords(value)}
                                        />
                                    </div>
                                ),
                                dataIndex: 'label',
                            },
                        ]}
                        rowSelection={{
                            hideSelectAll: true,
                            selectedRowKeys: selectedKeys,
                            onSelect: ({ value }) => {
                                setSelectedKeys(current =>
                                    current.includes(value)
                                        ? current.filter(k => k !== value)
                                        : [...current, value]
                                );
                            },
                        }}
                        loading={list.isLoading}
                        pagination={{
                            current: paginator.page || 1,
                            pageSize: paginator.pageSize || 10,
                            onChange: (page, pageSize) => {
                                paginator.setPage(page);
                                paginator.setPageSize(pageSize);
                            },
                            total: paginator.total || 0,
                        }}
                    />
                    <List<User>
                        style={{ flex: 1 }}
                        header={<h3>Selected</h3>}
                        dataSource={orderBy((selected.value as User[]) || [], 'name')}
                        renderItem={item => (
                            <List.Item
                                actions={[
                                    <Button
                                        onClick={() => setEditId(item.id)}
                                        icon={<EditOutlined />}
                                    />,
                                ]}
                            >
                                {item.id === editId ? (
                                    <Input
                                        disabled={isUpdating}
                                        defaultValue={item.name}
                                        onPressEnter={event => {
                                            saveUser({
                                                ...item.toJS(),
                                                name: (event.target as HTMLInputElement).value,
                                            });
                                        }}
                                    />
                                ) : (
                                    item.name
                                )}
                            </List.Item>
                        )}
                    />
                </div>
            </AntdUiProvider>
        </React.Suspense>
    );
}
