import { WidgetProps } from '@prestojs/ui';
import React from 'react';
import { InputNumber } from 'antd';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
// TODO - We might want to add currency type support to this field one day.
// TODO - do we want to limit currency decimal points to 2? there ARE countries in the world where 2's not enough eg CLF...
const CurrencyWidget = React.forwardRef(
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

export default CurrencyWidget;
