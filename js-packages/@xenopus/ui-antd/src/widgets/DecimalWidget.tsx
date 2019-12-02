import { WidgetProps } from '@xenopus/ui';
import React from 'react';
import { InputNumber } from 'antd';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
export default function DecimalWidget({
    input,
}: WidgetProps<string, HTMLElement>): React.ReactElement {
    const { value, ...rest } = input;
    const valueNum: number | null | undefined =
        value === undefined || value === null ? value : Number(value);
    return <InputNumber value={valueNum} {...rest} />;
}
