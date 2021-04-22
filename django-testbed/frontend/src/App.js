import { getFormatterForField } from '@prestojs/ui';
import { AntdUiProvider, FormItemWrapper, FormWrapper, getWidgetForField } from '@prestojs/ui-antd';
import { mount, redirect, route } from 'navi';
import React from 'react';
import { Router, View } from 'react-navi';
import { SWRConfig } from 'swr';

// eslint-disable-next-line import/extensions
import './styles/global.less?no-css-modules';

import UserListView from './views/UserListView';

const DatePicker = React.lazy(() => import('./DatePicker'));
const TimePicker = React.lazy(() => import('./TimePicker'));

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
            <AntdUiProvider
                datePickerComponent={DatePicker}
                timePickerComponent={TimePicker}
                getFormatterForField={getFormatterForField}
                getWidgetForField={getWidgetForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <SWRConfig>
                    <Router routes={routes}>
                        <View />
                    </Router>
                </SWRConfig>
            </AntdUiProvider>
        </React.Suspense>
    );
}
