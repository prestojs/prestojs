import { WidgetProps } from '@prestojs/ui';
import { Checkbox } from 'antd';
import React from 'react';

/**
 * See [Checkbox](https://next.ant.design/components/checkbox/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
const BooleanWidget = React.forwardRef<HTMLInputElement, WidgetProps<boolean, HTMLInputElement>>(
    ({ input, ...rest }: WidgetProps<boolean, HTMLInputElement>, ref): React.ReactElement => {
        const { value, ...restInput } = input;
        return <Checkbox ref={ref} checked={!!value} {...restInput} {...rest} />;
    }
);

export default BooleanWidget;
