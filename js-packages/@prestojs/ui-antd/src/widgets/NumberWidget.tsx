import { WidgetProps } from '@prestojs/ui/FieldWidgetInterface';
import { InputNumber } from 'antd';
import React from 'react';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
const NumberWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<number, HTMLInputElement>,
        ref: React.RefObject<typeof InputNumber>
    ): React.ReactElement => {
        return <InputNumber ref={ref} {...input} {...rest} />;
    }
);

export default NumberWidget;
