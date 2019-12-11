import { Input } from 'antd';
import React from 'react';
import { UiProvider } from '@xenopus/ui';
import { getWidgetForField as antdGetWidgetForField, FormItemWrapper } from '@xenopus/ui-antd';
import { SWRConfig } from 'swr';

// eslint-disable-next-line import/extensions
import './styles/global.less?no-css-modules';
import UserListView from './views/UserListView';

const DefaultWidget = ({ input }) => <Input {...input} />;

function getWidgetForField(field) {
    const widget = antdGetWidgetForField(field);
    if (!widget) {
        return DefaultWidget;
    }
    return widget;
}

export default function App() {
    return (
        <UiProvider getWidgetForField={getWidgetForField} formItemComponent={FormItemWrapper}>
            <SWRConfig>
                <UserListView />
            </SWRConfig>
            <hr />
            {User.label} / {User.labelPlural}
            <hr />
            {/* eslint-disable-next-line no-console */}
            <Form onSubmit={data => console.log(data)} onChange={data => console.log(data)}>
                {({ handleSubmit, values }) => (
                    <AntForm onSubmit={handleSubmit} layout="horizontal" {...formItemLayout}>
                        <Form.Item field={User.fields.age} />
                        <Form.Item field={User.fields.photo} />
                        <Form.Item field={User.fields.adult} />
                        <Form.Item label="Not A Real Field">
                            <Form.Field
                                name="notARealField"
                                render={({ input }) => <Input {...input} />}
                            />
                        </Form.Item>
                        <pre>{JSON.stringify(values, 0, 2)}</pre>
                    </AntForm>
                )}
            </Form>
        </UiProvider>
    );
}
