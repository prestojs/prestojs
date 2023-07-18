/**
 * Selector with arguments
 *
 * This example shows a selector that takes arguments. The arguments are passed as the third argument to `useSelector`.
 *
 * The selector is also defined outside the render on the static `selectors` property on the ViewModel. This isn't required
 * but is a nice convention to keep the selectors and the ViewModel they are for together.
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import {
    CharField,
    EmailField,
    IntegerField,
    useViewModelCache,
    ViewModelCache,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { Button, Table } from 'antd';
import 'antd/dist/antd.min.css';
import React, { useState } from 'react';

class User extends viewModelFactory(
    {
        id: new IntegerField(),
        name: new CharField(),
        email: new EmailField(),
    },
    { pkFieldName: 'id' }
) {
    static selectors = {
        getAll(
            cache: ViewModelCache<typeof User>,
            sortBy?: 'email' | 'name',
            direction?: 'ascend' | 'descend'
        ) {
            const users = cache.getAll('*');
            if (!sortBy) {
                return users;
            }
            return users.sort((a, b) => {
                const valueA = (a[sortBy] || '').toLocaleLowerCase();
                const valueB = (b[sortBy] || '').toLocaleLowerCase();
                return direction === 'ascend'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            });
        },
    };
}

let lastId = 0;

User.cache.add([
    { id: lastId++, name: 'John', email: 'john@example.com' },
    { id: lastId++, name: 'Jane', email: 'jane@example.com' },
    { id: lastId++, name: 'Bob', email: 'bob@example.com' },
    { id: lastId++, name: 'Alice', email: 'alice@example.com' },
    { id: lastId++, name: 'Fred', email: 'fred@example.com' },
    { id: lastId++, name: 'Sally', email: 'sally@example.com' },
    { id: lastId++, name: 'Joe', email: 'joe@example.com' },
]);

export default function MemoizeExample() {
    const [sort, setSort] = useState<{
        fieldName?: 'name' | 'email';
        direction?: 'ascend' | 'descend' | null;
    }>({ fieldName: 'name', direction: 'ascend' });
    const users = useViewModelCache(User, User.selectors.getAll, [sort.fieldName, sort.direction]);
    return (
        <React.Suspense fallback="Loading...">
            <AntdUiProvider
                getWidgetForField={getWidgetForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <Form
                    onSubmit={(data, form) => {
                        User.cache.add({ id: lastId++, ...data });
                        form.reset();
                    }}
                >
                    <Form.Item field={User.fields.name} />
                    <Form.Item field={User.fields.email} />
                    <Form.Item wrapperCol={{ offset: 6 }}>
                        <Button type="primary" htmlType="submit">
                            Create User
                        </Button>
                    </Form.Item>
                </Form>
                <Table
                    onChange={(pagination, filters, sorter) => {
                        sorter = Array.isArray(sorter) ? sorter[0] : sorter;
                        setSort({
                            fieldName: sorter.order
                                ? (sorter.field as 'name' | 'email')
                                : undefined,
                            direction: sorter.order,
                        });
                    }}
                    rowKey="_key"
                    pagination={false}
                    dataSource={users}
                    columns={[
                        {
                            title: 'User',
                            dataIndex: 'name',
                            sorter: true,
                            sortOrder: sort.fieldName === 'name' ? sort.direction : undefined,
                        },
                        {
                            title: 'Email',
                            dataIndex: 'email',
                            sorter: true,
                            sortOrder: sort.fieldName === 'email' ? sort.direction : undefined,
                        },
                    ]}
                />
            </AntdUiProvider>
        </React.Suspense>
    );
}
