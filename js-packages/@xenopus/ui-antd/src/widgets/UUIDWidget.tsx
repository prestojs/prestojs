import { WidgetProps } from '@xenopus/ui';
import { Input } from 'antd';
import React from 'react';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
const UUIDWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<string, HTMLInputElement>,
        ref: React.RefObject<Input>
    ): React.ReactElement => {
        return <Input ref={ref} {...input} {...rest} />;
    }
);

export default UUIDWidget;
