import React, { useState } from 'react';
import { Button, Modal } from 'antd';

import User, { userList } from '../models/User';
import useConnected from '../useConnected';
import useRestAction from '../useRestAction';
import UserCreateUpdateView from './UserCreateUpdateView';

export default function UserListView() {
    const [selectedId, selectId] = useState();
    const [showCreate, setShowCreate] = useState(false);
    const { data, error } = useRestAction(userList);

    if (error) {
        throw error;
    }

    const records = useConnected(data);
    if (!records) {
        return null;
    }
    return (
        <>
            {User.label} / {User.labelPlural}
            <Button type="primary" onClick={() => setShowCreate(true)}>
                Add User
            </Button>
            <hr />
            <table>
                <tbody>
                    {records.map(record => (
                        <tr key={record._pk}>
                            <td>
                                {record.first_name} {record.last_name}
                            </td>
                            <td>{record.email}</td>
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
