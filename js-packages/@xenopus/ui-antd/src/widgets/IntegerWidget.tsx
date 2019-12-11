import { WidgetProps } from '@xenopus/ui';
import React from 'react';
import { InputNumber } from 'antd';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
const IntegerWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<number, HTMLInputElement>,
        ref: React.RefObject<InputNumber>
    ): React.ReactElement => {
        return <InputNumber ref={ref} {...rest} {...input} />;
    }
);

export default IntegerWidget;
