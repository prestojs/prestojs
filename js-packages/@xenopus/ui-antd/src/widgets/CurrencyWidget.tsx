import { WidgetProps } from '@xenopus/ui';
import React from 'react';
import { InputNumber } from 'antd';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
// TODO - We might want to add currency type support to this field one day.
// TODO - do we want to limit currency decimal points to 2? there ARE countries in the world where 2's not enough eg CLF...
export default function CurrencyWidget({
    input,
}: WidgetProps<string, HTMLElement>): React.ReactElement {
    const { value, ...rest } = input;
    const valueNum: number | null | undefined =
        value === undefined || value === null ? value : Number(value);
    return <InputNumber value={valueNum} {...rest} />;
}
