import { WidgetProps } from '@prestojs/ui';
import { Input, InputProps, InputRef } from 'antd';
import React from 'react';

/**
 * @expand-properties
 */
type EmailWidgetProps = WidgetProps<string, HTMLInputElement> &
    Omit<InputProps, 'onChange' | 'value'>;

/**
 * See [Input](https://ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function EmailWidget(props: EmailWidgetProps, ref: React.RefObject<InputRef>): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input type="email" ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(EmailWidget);
