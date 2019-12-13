import React from 'react';
import { Field } from '@xenopus/viewmodel';
import { RangedWidgetProps, WidgetProps } from './FieldWidgetInterface';
import useUi from './useUi';

/*
 Wraps around getWidgetForField to always return ReactElement; Applies default props from getWidgetForField if any.
 */
export default function FieldWidget<FieldValue, T extends HTMLElement>({
    field,
    ...rest
}: (RangedWidgetProps<FieldValue, T, any> | WidgetProps<FieldValue, T>) & {
    field: Field<FieldValue>;
}): React.ReactElement | null {
    const { getWidgetForField } = useUi();

    const Widget = getWidgetForField<FieldValue, HTMLElement>(field);

    if (Array.isArray(Widget)) {
        const [ActualWidget, props] = Widget;
        return <ActualWidget {...props} {...rest} />;
    } else {
        return <Widget {...rest} />;
    }
}
