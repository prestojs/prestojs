import { Input } from 'antd';
import React from 'react';
import { UiProvider, getFormatterForField } from '@prestojs/ui';
import {
    FormWrapper,
    getWidgetForField as antdGetWidgetForField,
    FormItemWrapper,
} from '@prestojs/ui-antd';
import { SWRConfig } from 'swr';
import { Router, View } from 'react-navi';
import { mount, route, redirect } from 'navi';

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

const routes = mount({
    '/': redirect('/users/'),
    '/users/': route({
        title: 'Users',
        view: <UserListView />,
    }),
});

export default function App() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <UiProvider
                getWidgetForField={getWidgetForField}
                getFormatterForField={getFormatterForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <SWRConfig>
                    <Router routes={routes}>
                        <View />
                    </Router>
                </SWRConfig>
            </UiProvider>
        </React.Suspense>
    );
}
