/**
 * Simple usage
 *
 * Shows how to define a ViewModel with relations and retrieve data from the cache
 */
import {
    CharField,
    IntegerField,
    ListField,
    ManyRelatedViewModelField,
    useViewModelCache,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { Table } from 'antd';
import 'antd/dist/antd.min.css';
import React from 'react';

class Group extends viewModelFactory(
    {
        id: new IntegerField(),
        name: new CharField(),
    },
    { pkFieldName: 'id' }
) {}

class User extends viewModelFactory(
    {
        id: new IntegerField(),
        name: new CharField(),
        groupIds: new ListField({ childField: new IntegerField() }),
        groups: new ManyRelatedViewModelField({
            to: Group,
            sourceFieldName: 'groupIds',
        }),
    },
    { pkFieldName: 'id' }
) {}

Group.cache.add([
    { id: 1, name: 'Admins' },
    { id: 2, name: 'Managers' },
    { id: 3, name: 'Customer Support' },
    { id: 4, name: 'Tech Support' },
    { id: 5, name: 'Sales' },
]);
User.cache.addList([
    { id: 1, name: 'Dave', groupIds: [1, 4] },
    { id: 2, name: 'Sarah', groupIds: [3, 4, 5] },
    { id: 3, name: 'Jen', groupIds: [1, 2, 3] },
]);

export default function CacheUsage() {
    const users = useViewModelCache(User, cache => cache.getAll(['name', 'groups']));
    return (
        <Table
            rowKey="_key"
            pagination={false}
            dataSource={users}
            columns={[
                { title: 'User', dataIndex: 'name' },
                {
                    title: 'Groups',
                    dataIndex: 'groups',
                    render(groups) {
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {groups.map(group => (
                                    <div key={group._key}>{group.name}</div>
                                ))}
                            </div>
                        );
                    },
                },
            ]}
        />
    );
}
