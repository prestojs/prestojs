import React from 'react';
import { Field } from '@xenopus/viewmodel';
import { WidgetProps } from './FieldWidgetInterface';
import useUi from './useUi';

export default function FieldWidget<FieldValue, T extends HTMLElement>({
    field,
    ...rest
}: WidgetProps<number, HTMLInputElement> & {
    field: Field<FieldValue>;
}): React.ReactElement | null {
    const { getWidgetForField } = useUi();

    const Widget = getWidgetForField(field);

    if (!Widget) return null;

    if (Array.isArray(Widget)) {
        const [ActualWidget, props] = Widget;
        return <ActualWidget {...props} {...rest} />;
    } else {
        return <Widget {...rest} />;
    }
}
