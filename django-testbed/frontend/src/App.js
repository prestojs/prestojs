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
        </UiProvider>
    );
}
