import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import React from 'react';

type PasswordWidgetProps = WidgetProps<string, HTMLInputElement>;

/**
 *
 * See [Input](https://ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function PasswordWidget(
    props: PasswordWidgetProps,
    ref: React.RefObject<Input>
): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input.Password ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(PasswordWidget);
