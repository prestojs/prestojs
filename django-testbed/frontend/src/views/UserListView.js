import { FieldFormatter } from '@prestojs/ui';
import { useListChangeObserver } from '@prestojs/util';
import { useViewModelCache } from '@prestojs/viewmodel';
import { Button, Modal } from 'antd';
import qs from 'qs';
import React, { useState } from 'react';

import User from '../models/User';
import useEndpoint from '../useEndpoint';
import useNaviUrlQueryState from '../useNaviUrlQueryState';
import UserCreateUpdateView from './UserCreateUpdateView';
import UserFilterForm from './UserFilterForm';

// TODO: We don't yet support selecting partial fields on backend
const fieldList = ['email', 'firstName', 'lastName'];

export default function UserListView() {
    const { search, pathname, origin } = window.location;
    const { paginationType } = qs.parse(search, { ignoreQueryPrefix: true });
    const [filter, setFilter] = useNaviUrlQueryState();
    const paginationStatePair = useNaviUrlQueryState({}, { prefix: 'p_' });
    const [selectedId, selectId] = useState();
    const [showCreate, setShowCreate] = useState(false);
    const { data, error, paginator, revalidate, isValidating } = useEndpoint(
        User.endpoints.list,
        {
            query: {
                ...filter,
                paginationType,
            },
        },
        {
            paginationStatePair,
        }
        // { refreshInterval: 10000 }
    );
    if (error) {
        throw error;
    }

    // Refetch data whenever underlying cache changes
    const allRecords = useViewModelCache(User, cache => cache.getAll(fieldList));
    useListChangeObserver(!isValidating && allRecords, revalidate);

    const records = useViewModelCache(User, cache => data && cache.getList(data.result));
    if (!records) {
        return null;
    }
    return (
        <>
            <div>
                Pagination Type ({paginationType}):
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
            <UserFilterForm onApplyFilter={setFilter} initialValues={filter} />
            <Button onClick={() => paginator.first()}>First</Button>
            <Button onClick={() => paginator.previous()}>Previous</Button>
            <Button onClick={() => paginator.next()}>Next</Button>
            <Button onClick={() => paginator.last()}>Last</Button>
            <Button
                onClick={() => {
                    paginationType === 'limitOffset'
                        ? paginator.setLimit(6)
                        : paginator.setPageSize(6);
                }}
            >
                Page Size 6
            </Button>
            <Button
                onClick={() => {
                    paginationType === 'limitOffset'
                        ? paginator.setLimit(10)
                        : paginator.setPageSize(10);
                }}
            >
                Page Size 10
            </Button>
            <Button
                onClick={() => {
                    paginationType === 'limitOffset'
                        ? paginator.setLimit(null)
                        : paginator.setPageSize(null);
                }}
            >
                Reset Page Size
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
                        <tr key={record._key}>
                            <td>
                                <FieldFormatter
                                    field={User.fields.firstName}
                                    value={record.firstName}
                                />
                                <FieldFormatter
                                    field={User.fields.lastName}
                                    value={record.lastName}
                                />
                            </td>
                            <td>
                                <FieldFormatter field={User.fields.email} value={record.email} />
                            </td>
                            <td>
                                <FieldFormatter field={User.fields.region} value={record.region} />
                            </td>
                            <td>
                                <button onClick={() => selectId(record._key)}>Edit</button>
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
