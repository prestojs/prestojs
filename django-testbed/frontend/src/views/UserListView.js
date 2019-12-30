import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import qs from 'qs';

import { FieldFormatter } from '@prestojs/ui';

import User from '../models/User';
import useConnected from '../useConnected';
import useEndpoint from '../useEndpoint';
import UserCreateUpdateView from './UserCreateUpdateView';
import UserFilterForm from './UserFilterForm';

export default function UserListView() {
    const { search, pathname, origin } = window.location;
    const { paginationType } = qs.parse(search.split('?').pop());
    const [selectedId, selectId] = useState();
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState({});
    const { data, error, paginator, setPaginationState } = useEndpoint(
        User.endpoints.list,
        {
            query: {
                ...filter,
                paginationType,
            },
        }
        // { refreshInterval: 10000 }
    );
    if (error) {
        throw error;
    }

    const records = useConnected(data && data.result);
    if (!records) {
        return null;
    }
    return (
        <>
            <div>
                Pagination Type:
                {['limitOffset', 'pageNumber', 'cursor'].map(type => (
                    <Button
                        type="link"
                        key={type}
                        href={`${origin}${pathname}?paginationType=${type}`}
                    >
                        {type}
                    </Button>
                ))}
            </div>
            {User.label} / {User.labelPlural}
            <Button type="primary" onClick={() => setShowCreate(true)}>
                Add User
            </Button>
            <hr />
            <UserFilterForm onApplyFilter={setFilter} />
            <Button onClick={() => paginator.first()}>First</Button>
            <Button onClick={() => paginator.previous()}>Previous</Button>
            <Button onClick={() => paginator.next()}>Next</Button>
            <Button onClick={() => paginator.last()}>Last</Button>
            <Button
                onClick={() =>
                    setPaginationState({
                        [paginationType === 'limitOffset' ? 'limit' : 'pageSize']: 5,
                    })
                }
            >
                Page Size 5
            </Button>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Region</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map(record => (
                        <tr key={record._pk}>
                            <td>
                                <FieldFormatter
                                    field={User.fields.first_name}
                                    value={record.first_name}
                                />
                                <FieldFormatter
                                    field={User.fields.last_name}
                                    value={record.last_name}
                                />
                            </td>
                            <td>
                                <FieldFormatter field={User.fields.email} value={record.email} />
                            </td>
                            <td>
                                <FieldFormatter field={User.fields.region} value={record.region} />
                            </td>
                            <td>
                                <button onClick={() => selectId(record._pk)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Modal visible={!!selectedId} onCancel={() => selectId(null)} footer={null}>
                {selectedId && (
                    <UserCreateUpdateView userId={selectedId} onSuccess={() => selectId(null)} />
                )}
            </Modal>
            <Modal visible={showCreate} onCancel={() => setShowCreate(false)} footer={null}>
                {showCreate && <UserCreateUpdateView onSuccess={() => setShowCreate(false)} />}
            </Modal>
        </>
    );
}
