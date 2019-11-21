import React from 'react';
import { UiProvider, useUi } from '@xenopus/ui';
import { getWidgetForField as antdGetWidgetForField } from '@xenopus/ui-antd';

import User from './models/User';

function getWidgetForField(field) {
    return antdGetWidgetForField(field);
}

function FieldWrapper({ field }) {
    const context = useUi();
    const Widget = context.getWidgetForField(field);
    return (
        <label>
            {field.label} <Widget />
        </label>
    );
}

export default function App() {
    return (
        <UiProvider getWidgetForField={getWidgetForField}>
            {User._meta.label} / {User._meta.labelPlural}
            <hr />
            <FieldWrapper field={User.age} />
        </UiProvider>
    );
}
