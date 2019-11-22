import React from 'react';
import { Form } from '@xenopus/final-form';
import { UiProvider } from '@xenopus/ui';
import { getWidgetForField as antdGetWidgetForField, FormItemWrapper } from '@xenopus/ui-antd';
import { Form as AntForm, Input } from 'antd';

// eslint-disable-next-line import/extensions
import './styles/global.less?no-css-modules';

import User from './models/User';

function getWidgetForField(field) {
    return antdGetWidgetForField(field);
}

export default function App() {
    const formItemLayout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 14 },
    };
    return (
        <UiProvider getWidgetForField={getWidgetForField} formItemComponent={FormItemWrapper}>
            {User._meta.label} / {User._meta.labelPlural}
            <hr />
            {/* eslint-disable-next-line no-console */}
            <Form modelView={User} onSubmit={data => console.log(data)}>
                {({ handleSubmit }) => (
                    <AntForm onSubmit={handleSubmit} layout="horizontal" {...formItemLayout}>
                        <Form.Item field={User.age} />
                        <Form.Item label="Not A Real Field">
                            <Form.Field
                                name="notARealField"
                                render={({ input }) => <Input {...input} />}
                            />
                        </Form.Item>
                    </AntForm>
                )}
            </Form>
        </UiProvider>
    );
}
