import { WidgetProps } from '@prestojs/ui';
import { Input, InputRef } from 'antd';
import React from 'react';

type PasswordWidgetProps = WidgetProps<string, HTMLInputElement>;

/**
 *
 * See [Input.Password](https://ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function PasswordWidget(
    props: PasswordWidgetProps,
    ref: React.RefObject<InputRef>
): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input.Password ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(PasswordWidget);
