import { WidgetProps } from '@xenopus/ui/FieldWidget';
import { InputNumber } from 'antd';
import React from 'react';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
export default function NumberWidget<T extends HTMLElement>({
    input,
}: WidgetProps<number, T>): React.ReactElement {
    // Not sure about this - issues with compatibility between types in antd, eg.
    // event is optional in onFocus in WidgetProps but not in the antd input
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return <InputNumber {...input} />;
}
