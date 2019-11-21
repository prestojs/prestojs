import React from 'react';
import { ModelViewForm } from '@xenopus/final-form';
import { UiProvider } from '@xenopus/ui';
import { getWidgetForField as antdGetWidgetForField } from '@xenopus/ui-antd';

import User from './models/User';

function getWidgetForField(field) {
    return antdGetWidgetForField(field);
}

function FieldWrapper({ field }) {
    return (
        <label>
            {field.label} <ModelViewForm.Field field={field} />
        </label>
    );
}

export default function App() {
    return (
        <UiProvider getWidgetForField={getWidgetForField}>
            {User._meta.label} / {User._meta.labelPlural}
            <hr />
            {/* eslint-disable-next-line no-console */}
            <ModelViewForm onSubmit={data => console.log(data)} initialValues={{ age: 5 }}>
                <FieldWrapper field={User.age} />
                <button type="submit">Submit</button>
            </ModelViewForm>
        </UiProvider>
    );
}
