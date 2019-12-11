import { WidgetProps } from '@xenopus/ui';
import React from 'react';
import { InputNumber } from 'antd';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
const DecimalWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<string, HTMLInputElement>,
        ref: React.RefObject<InputNumber>
    ): React.ReactElement => {
        const { value, ...restInput } = input;
        const valueNum: number | null | undefined =
            value === undefined || value === null ? value : Number(value);
        return <InputNumber ref={ref} value={valueNum} {...restInput} {...rest} />;
    }
);

export default DecimalWidget;
