import { WidgetProps } from '@xenopus/ui';
import React from 'react';
import { InputNumber } from 'antd';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
export default function FloatWidget({
    input,
}: WidgetProps<number, HTMLElement>): React.ReactElement {
    return <InputNumber {...input} />;
}
