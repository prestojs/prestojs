import { WidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import React from 'react';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
const IntegerWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<number, HTMLInputElement>,
        ref: React.RefObject<typeof InputNumber>
    ): React.ReactElement => {
        return <InputNumber ref={ref} {...rest} {...input} />;
    }
);

export default IntegerWidget;
