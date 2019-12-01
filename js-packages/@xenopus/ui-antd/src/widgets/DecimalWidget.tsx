import { WidgetProps } from '@xenopus/ui/FieldWidget';
import React from 'react';
import NumberWidget from './NumberWidget';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
export default function DecimalWidget({
    input,
    meta,
}: WidgetProps<string, HTMLElement>): React.ReactElement {
    const { value, ...rest } = input;
    const valueNum = value === undefined || value === null ? value : Number(value);
    return <NumberWidget {...{ input: { value: valueNum, ...rest }, meta }} />;
}
