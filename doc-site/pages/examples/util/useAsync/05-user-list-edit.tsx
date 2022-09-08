/**
 * List & edit view
 *
 * This full example shows how a list view with inline edit might work using an [Endpoint](doc:Endpoint) and
 * [ViewModel](doc:viewModelFactory).
 *
 * When data for a model is changed it's written to the cache and the UI will reflect that. A `useAsync` with `trigger="MANUAL"`
 * is used for the edit and delete, and `trigger="SHALLOW"` for the listing.
 */
import { Form } from '@prestojs/final-form';
import {
    ApiError,
    Endpoint,
    paginationMiddleware,
    viewModelCachingMiddleware,
} from '@prestojs/rest';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { PageNumberPaginator, useAsync, usePaginator } from '@prestojs/util';
import {
    CharField,
    DateField,
    IntegerField,
    useViewModelCache,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { Button, Input, message, Modal, Space, Table } from 'antd';
import 'antd/dist/antd.css';
import React from 'react';

class User extends viewModelFactory(
    { id: new IntegerField(), name: new CharField(), registeredOn: new DateField() },
    { pkFieldName: 'id' }
) {
    static endpoints = {
        list: new Endpoint<User[]>('/api/paginated-users', {
            middleware: [viewModelCachingMiddleware(User), paginationMiddleware()],
        }),
        update: new Endpoint<User>('/api/user/:id', {
            middleware: [viewModelCachingMiddleware(User)],
            method: 'PUT',
        }),
        delete: new Endpoint<User>('/api/user/:id', {
            middleware: [viewModelCachingMiddleware(User)],
            method: 'DELETE',
        }),
    };
}

export default function UserListEdit() {
    const [filter, setFilter] = React.useState('');
    const [editUser, setEditUser] = React.useState<null | User>(null);
    const paginator = usePaginator(User.endpoints.list) as PageNumberPaginator;
    const { result, isLoading } = useAsync(
        User.endpoints.list.prepare({ query: { filter }, paginator }),
        {
            trigger: 'SHALLOW',
        }
    );
    const { run: updateUser, isLoading: isSavingUser } = useAsync(data =>
        User.endpoints.update.execute({
            urlArgs: { id: editUser?.id },
            body: JSON.stringify(data),
        })
    );
    const { run: deleteUser } = useAsync(
        user =>
            User.endpoints.delete.execute({
                urlArgs: { id: user.id },
            }),
        {
            onSuccess() {
                message.success('User deleted');
            },
        }
    );
    const users = useViewModelCache(User, cache => cache.getList(result?.result || []));
    const onSearch = ({ target: { value } }) => {
        // When filter changes the paginator should reset to page 1 as it's
        // a new dataset
        paginator.setPage(1);
        setFilter(value);
    };
    return (
        <AntdUiProvider
            getWidgetForField={getWidgetForField}
            formItemComponent={FormItemWrapper}
            formComponent={FormWrapper}
        >
            <Input
                disabled={isLoading}
                type="search"
                placeholder="Search"
                // @ts-ignore
                onPressEnter={onSearch}
                onBlur={onSearch}
                style={{ maxWidth: 300, marginBottom: 20 }}
            />
            <Table
                rowKey="_key"
                loading={isLoading}
                pagination={{
                    current: paginator.page || 1,
                    pageSize: paginator.pageSize || 10,
                    onChange: (page, pageSize) => {
                        paginator.setPage(page);
                        paginator.setPageSize(pageSize);
                    },
                    total: paginator.total || 0,
                }}
                dataSource={users}
                columns={[
                    { title: 'Name', dataIndex: 'name' },
                    {
                        title: 'Actions',
                        render(user) {
                            return (
                                <Space>
                                    <Button type="link" onClick={() => setEditUser(user)}>
                                        Edit
                                    </Button>
                                    <Button type="link" danger onClick={() => deleteUser(user)}>
                                        Delete
                                    </Button>
                                </Space>
                            );
                        },
                    },
                ]}
                locale={{ emptyText: 'No results' }}
            />
            <Modal
                visible={!!editUser}
                title={editUser ? `Edit '${editUser.name}'` : null}
                onCancel={() => setEditUser(null)}
                okButtonProps={{ form: 'edit-form', htmlType: 'submit', disabled: isSavingUser }}
                okText="Save User"
            >
                {editUser && (
                    <Form
                        formProps={{ id: 'edit-form' }}
                        initialValues={{ name: editUser.name }}
                        onSubmit={async data => {
                            try {
                                await updateUser(data);
                                message.success('User updated');
                                setEditUser(null);
                            } catch (error) {
                                if (!(error instanceof ApiError) || error.status === 500) {
                                    message.error('There was an unexpected error');
                                } else {
                                    message.error(error.content);
                                }
                            }
                        }}
                    >
                        <Form.Item field={User.fields.name} />
                    </Form>
                )}
            </Modal>
        </AntdUiProvider>
    );
}
