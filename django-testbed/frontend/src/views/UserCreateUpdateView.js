import { Form } from '@prestojs/final-form';
import { useViewModelCache } from '@prestojs/viewmodel';
import { Button } from 'antd';
import React from 'react';

import User from '../models/User';
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
    const fieldNames = ['firstName', 'lastName', 'email', 'region'];
    const record = useViewModelCache(User, cache => data && cache.get(data.result, fieldNames));
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
                    Updating: {record.firstName} {record.lastName} ({record.email})
                </p>
            )}
            {/* eslint-disable-next-line no-console */}
            <Form
                onSubmit={onSubmit}
                initialValues={record && record.toJS()}
                formProps={{ layout: 'horizontal' }}
            >
                <Form.Item field={User.fields.firstName} />
                <FieldErrors name="firstName" />
                <Form.Item field={User.fields.lastName} />
                <FieldErrors name="lastName" />
                <Form.Item field={User.fields.email} />
                <FieldErrors name="email" />
                <Form.Item field={User.fields.region} />
                <FieldErrors name="region" />
                <Form.Item field={User.fields.referredBy} fieldProps={{ allowClear: true }} />
                <FieldErrors name="referredBy" />
                <Form.Item field={User.fields.referredByGrouped} />
                <FieldErrors name="referredByGrouped" />
                <Form.Item field={User.fields.friends} />
                <FieldErrors name="friends" />
                <hr />
                <Button htmlType="submit" type="primary">
                    Save
                </Button>
            </Form>
        </>
    );
}
