import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import React from 'react';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
const URLWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<string, HTMLInputElement>,
        ref: React.RefObject<Input>
    ): React.ReactElement => {
        return <Input ref={ref} {...input} {...rest} />;
    }
);

export default URLWidget;
