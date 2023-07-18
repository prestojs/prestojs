import { Field } from '@prestojs/viewmodel';
import React, { useMemo } from 'react';
import { RangedWidgetProps, WidgetProps } from './FieldWidgetInterface';
import useUi from './useUi';

/**
 * @expandproperties
 */
export type FieldWidgetProps<FieldValue, ParsableValueT, SingleValueT, T extends HTMLElement> = (
    | RangedWidgetProps<FieldValue, T, any>
    | WidgetProps<FieldValue, T>
) & {
    field: Field<FieldValue, ParsableValueT, SingleValueT>;
};

/**
 * Wraps around getWidgetForField to always return ReactElement; Applies default props from getWidgetForField if any.
 *
 * @extractdocs
 */
export default function FieldWidget<
    FieldValue,
    ParsableValueT,
    SingleValueT,
    T extends HTMLElement
>({
    field,
    ...rest
}: FieldWidgetProps<FieldValue, ParsableValueT, SingleValueT, T>): React.ReactElement | null {
    const { getWidgetForField } = useUi();

    const Widget = useMemo(() => getWidgetForField(field), [field, getWidgetForField]);

    if (Array.isArray(Widget)) {
        const [ActualWidget, props] = Widget;
        return <ActualWidget {...props} {...rest} />;
    } else {
        return <Widget {...rest} />;
    }
}
