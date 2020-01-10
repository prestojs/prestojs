import React from 'react';
import { Breadcrumb } from '@prestojs/ui-antd';

import User from '../models/User';
import useConnected from '../useConnected';
import useEndpoint from '../useEndpoint';

export default function UserDetailView(props) {
    const { data, error } = useEndpoint(
        User.endpoints.retrieve,
        { urlArgs: { id: props.userid } },
        { refreshInterval: 10000 }
    );
    if (error) {
        throw error;
    }

    const record = useConnected(data);
    if (!record) {
        return null;
    }
    return (
        <>
            <Breadcrumb />
            <hr />
            <p>First Name: {record.first_name}</p>
            <p>Last Name: {record.last_name}</p>
        </>
    );
}
