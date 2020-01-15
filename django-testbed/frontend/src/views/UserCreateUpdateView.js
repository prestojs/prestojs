import { Button } from 'antd';
import React from 'react';
import { Form } from '@prestojs/final-form';

import User from '../models/User';
import useConnected from '../useConnected';
import useEndpoint from '../useEndpoint';

export function FieldErrors({ name }) {
    return (
        <Form.Field name={name}>
            {({ meta }) => (meta.submitError ? meta.submitError.join(', ') : null)}
        </Form.Field>
    );
}

export default function UserCreateUpdateView({ userId, onSuccess }) {
    // only relevant if userId is set
    const { data, error } = useEndpoint(userId && User.endpoints.retrieve, {
        urlArgs: { id: userId },
    });
    async function onSubmit(_data) {
        try {
            if (userId) {
                await User.endpoints.update.execute({
                    urlArgs: { id: userId },
                    body: JSON.stringify(_data),
                });
            } else {
                await User.endpoints.create.execute({
                    body: JSON.stringify(_data),
                });
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
                <Form.Item field={User.fields.first_name} />
                <FieldErrors name="first_name" />
                <Form.Item field={User.fields.last_name} />
                <FieldErrors name="last_name" />
                <Form.Item field={User.fields.email} />
                <FieldErrors name="email" />
                <Form.Item field={User.fields.region} />
                <FieldErrors name="region" />
                <hr />
                <Button htmlType="submit" type="primary">
                    Save
                </Button>
            </Form>
        </>
    );
}
