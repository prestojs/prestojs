import React from 'react';
import { UiProvider, getFormatterForField } from '@prestojs/ui';
import { Input } from 'antd';
import {
    getWidgetForField as antdGetWidgetForField,
    FormItemWrapper,
    Breadcrumb,
} from '@prestojs/ui-antd';
import { SWRConfig } from 'swr';
import { redirect } from 'navi';
import { Router, Link, View, NotFoundBoundary } from 'react-navi';
import { mount } from '@prestojs/routing';

import namedUrls from './namedUrls';
import UserListView from './views/UserListView';
import UserDetailView from './views/UserDetailView';

// eslint-disable-next-line import/extensions
import './styles/global.less?no-css-modules';

const DefaultWidget = ({ input }) => <Input {...input} />;

function getWidgetForField(field) {
    const widget = antdGetWidgetForField(field);
    if (!widget) {
        return DefaultWidget;
    }
    return widget;
}

const routes = mount(
    {
        home: {
            view: [<Breadcrumb />, <Link href={namedUrls.reverse('users')}>Users</Link>],
        },
        users: {
            view: <UserListView />,
        },
        'user-detail': req => ({
            view: <UserDetailView userid={req.params.id} />,
        }),
    },
    namedUrls
);

export default function App() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <UiProvider
                getWidgetForField={getWidgetForField}
                getFormatterForField={getFormatterForField}
                formItemComponent={FormItemWrapper}
            >
                <SWRConfig>
                    <Router routes={routes}>
                        <NotFoundBoundary render={() => redirect(namedUrls.reverse('home'))}>
                            <View />
                        </NotFoundBoundary>
                    </Router>
                </SWRConfig>
            </UiProvider>
        </React.Suspense>
    );
}
