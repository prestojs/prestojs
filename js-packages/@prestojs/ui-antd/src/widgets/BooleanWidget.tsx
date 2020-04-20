import { WidgetProps } from '@prestojs/ui/FieldWidgetInterface';
import { Checkbox } from 'antd';
import React from 'react';

/**
 * See [Checkbox](https://next.ant.design/components/checkbox/) for props available
 *
 * @extract-docs
 */
const BooleanWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<boolean, HTMLInputElement>,
        ref: React.RefObject<Checkbox>
    ): React.ReactElement => {
        const { value, ...restInput } = input;
        return <Checkbox ref={ref} checked={!!value} {...restInput} {...rest} />;
    }
);

export default BooleanWidget;
