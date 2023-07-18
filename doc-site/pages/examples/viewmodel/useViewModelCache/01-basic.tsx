/**
 * Basic usage
 *
 * This examples allows you to add data to the cache via a basic form and render a table of all items in the cache
 * in alphabetical order.
 *
 * @wide
 */
import { Form } from '@prestojs/final-form';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { CharField, IntegerField, useViewModelCache, viewModelFactory } from '@prestojs/viewmodel';
import { Button, Table } from 'antd';
import 'antd/dist/antd.min.css';
import React from 'react';

class User extends viewModelFactory(
    {
        id: new IntegerField(),
        name: new CharField(),
    },
    { pkFieldName: 'id' }
) {}

let lastId = 0;

export default function Basic() {
    const users = useViewModelCache(User, cache =>
        cache
            .getAll('*')
            .sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()))
    );
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
                    <Form.Item wrapperCol={{ offset: 6 }}>
                        <Button type="primary" htmlType="submit">
                            Create User
                        </Button>
                    </Form.Item>
                </Form>
                <Table
                    rowKey="_key"
                    pagination={false}
                    dataSource={users}
                    columns={[{ title: 'User', dataIndex: 'name' }]}
                />
            </AntdUiProvider>
        </React.Suspense>
    );
}
