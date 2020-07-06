import { WidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import React from 'react';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
const FloatWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<number, HTMLInputElement>,
        ref: React.RefObject<InputNumber>
    ): React.ReactElement => {
        return <InputNumber ref={ref} {...input} {...rest} />;
    }
);

export default FloatWidget;
