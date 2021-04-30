import { AntdUiProvider } from '@prestojs/ui-antd';
import React from 'react';
import AllFieldsForm from './AllFieldsForm';
import getFormatterForField from './getFormatterForField';

import getWidgetForField from './getWidgetForField';

const DatePicker = React.lazy(() => import('./DatePicker'));
const TimePicker = React.lazy(() => import('./TimePicker'));
const FormItemWrapper = React.lazy(() => import('@prestojs/ui-antd/FormItemWrapper'));
const FormWrapper = React.lazy(() => import('@prestojs/ui-antd/FormWrapper'));

export default function App() {
    return (
        <React.Suspense fallback={null}>
            <AntdUiProvider
                datePickerComponent={DatePicker}
                timePickerComponent={TimePicker}
                getFormatterForField={getFormatterForField}
                getWidgetForField={getWidgetForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <AllFieldsForm onSubmit={data => console.log(data)} />
            </AntdUiProvider>
        </React.Suspense>
    );
}
