import { WidgetProps } from '@xenopus/ui/FieldWidget';
import { InputNumber } from 'antd';
import React from 'react';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
// TODO - APPLY BOUNDARY LIMIT
export default function FloatRangeWidget({
    input,
}: WidgetProps<number, HTMLElement>): React.ReactElement {
    return <InputNumber {...input} />;
}
