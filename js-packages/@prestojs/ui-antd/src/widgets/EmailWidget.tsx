import { WidgetProps } from '@prestojs/ui';
import { Input, InputRef } from 'antd';
import React from 'react';

/**
 * @expand-properties
 */
type EmailWidgetProps = WidgetProps<string, HTMLInputElement>;

/**
 * See [Input](https://ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function EmailWidget(props: EmailWidgetProps, ref: React.RefObject<InputRef>): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(EmailWidget);
