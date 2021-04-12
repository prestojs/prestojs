import { AntdUiProvider } from '@prestojs/ui-antd';
import { mount, redirect, route } from 'navi';
import React from 'react';
import { Router, View } from 'react-navi';
import { SWRConfig } from 'swr';

import DatePicker from './DatePicker';

// eslint-disable-next-line import/extensions
import './styles/global.less?no-css-modules';
import TimePicker from './TimePicker';
import UserListView from './views/UserListView';

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
            <AntdUiProvider datePickerComponent={DatePicker} timePickerComponent={TimePicker}>
                <SWRConfig>
                    <Router routes={routes}>
                        <View />
                    </Router>
                </SWRConfig>
            </AntdUiProvider>
        </React.Suspense>
    );
}
