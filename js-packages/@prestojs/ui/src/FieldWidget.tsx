import { Field } from '@prestojs/viewmodel';
import React from 'react';
import { RangedWidgetProps, WidgetProps } from './FieldWidgetInterface';
import useUi from './useUi';

/**
 * Wraps around getWidgetForField to always return ReactElement; Applies default props from getWidgetForField if any.
 *
 * @extract-docs
 */
export default function FieldWidget<
    FieldValue,
    ParsableValueT,
    SingleValueT,
    T extends HTMLElement
>({
    field,
    ...rest
}: (RangedWidgetProps<FieldValue, T, any> | WidgetProps<FieldValue, T>) & {
    field: Field<FieldValue, ParsableValueT, SingleValueT>;
}): React.ReactElement | null {
    const { getWidgetForField } = useUi();

    const Widget = getWidgetForField<FieldValue, ParsableValueT, SingleValueT, HTMLElement>(field);

    if (Array.isArray(Widget)) {
        const [ActualWidget, props] = Widget;
        return <ActualWidget {...props} {...rest} />;
    } else {
        return <Widget {...rest} />;
    }
}
