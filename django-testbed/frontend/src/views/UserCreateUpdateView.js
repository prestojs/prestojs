import { Button, Form as AntForm } from 'antd';
import React from 'react';
import { Form } from '@xenopus/final-form';

import User, { userDetail, userList } from '../models/User';
import useConnected from '../useConnected';
import useEndpoint from '../useEndpoint';

function FieldErrors({ name }) {
    return (
        <Form.Field name={name}>
            {({ meta }) => (meta.submitError ? meta.submitError.join(', ') : null)}
        </Form.Field>
    );
}

export default function UserCreateUpdateView({ userId, onSuccess }) {
    const formItemLayout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 14 },
    };
    // only relevant if userId is set
    const { data, error, execute } = useEndpoint(userId && userDetail, {
        urlArgs: { id: userId },
    });
    async function onSubmit(_data) {
        try {
            if (userId) {
                // Execute the prepared action again (which has the id filled out) but now add
                // a body and set method to 'PATCH'
                await execute({ body: JSON.stringify(_data), method: 'PATCH' });
            } else {
                await userList.execute({ body: JSON.stringify(_data), method: 'POST' });
            }
            onSuccess();
            return null;
        } catch (err) {
            return err.content;
        }
    }
    const record = useConnected(data);
    if (error) {
        return error.message;
    }
    if (!record && userId) {
        return 'Loading';
    }
    return (
        <>
            {User.label} / {User.labelPlural}
            <hr />
            {record && (
                <p>
                    Updating: {record.first_name} {record.last_name} ({record.email})
                </p>
            )}
            {/* eslint-disable-next-line no-console */}
            <Form onSubmit={onSubmit} initialValues={record && record.toJS()}>
                {({ handleSubmit }) => (
                    <AntForm onSubmit={handleSubmit} layout="horizontal" {...formItemLayout}>
                        <Form.Item field={User.fields.first_name} />
                        <FieldErrors name="first_name" />
                        <Form.Item field={User.fields.last_name} />
                        <FieldErrors name="last_name" />
                        <Form.Item field={User.fields.email} />
                        <FieldErrors name="email" />
                        <Form.Item field={User.fields.age} />
                        <FieldErrors name="age" />
                        <hr />
                        <Button htmlType="submit" type="primary">
                            Save
                        </Button>
                    </AntForm>
                )}
            </Form>
        </>
    );
}
