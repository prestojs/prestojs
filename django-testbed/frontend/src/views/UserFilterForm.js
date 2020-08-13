import { Form, useForm } from '@prestojs/final-form';
import { Button, Collapse } from 'antd';
import React from 'react';
import User from '../models/User';

const { Panel } = Collapse;

function ClearButton() {
    const api = useForm();
    return (
        <Button
            onClick={() => {
                api.reset({});
                api.submit();
            }}
        >
            Reset
        </Button>
    );
}

export default function UserFilterForm({ initialValues, onApplyFilter }) {
    return (
        <Collapse defaultActiveKey={['generatedFilterForm']}>
            <Panel header="Filters" key="generatedFilterForm">
                <Form onSubmit={onApplyFilter} initialValues={initialValues}>
                    <Form.Item field={User.fields.id} />
                    <Form.Item field={User.fields.firstName} />
                    <Form.Item field={User.fields.lastName} />
                    <Button htmlType="submit" type="primary">
                        Search
                    </Button>
                    <ClearButton />
                </Form>
            </Panel>
        </Collapse>
    );
}
