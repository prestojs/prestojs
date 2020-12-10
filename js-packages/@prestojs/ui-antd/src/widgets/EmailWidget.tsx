import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type EmailWidgetProps = WidgetProps<string, HTMLInputElement>;

/**
 * See [Input](https://ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function EmailWidget(props: EmailWidgetProps, ref: React.RefObject<Input>): React.ReactElement {
    const { input, ...rest } = props;
    return <Input ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(EmailWidget);
