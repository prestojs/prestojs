import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type CharWidgetProps = WidgetProps<string, HTMLInputElement> & { type?: string };

/**
 *
 * To use Input.Password, pass a type="password" to your widget
 *
 * See [Input](https://ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function CharWidget(props: CharWidgetProps, ref: React.RefObject<Input>): React.ReactElement {
    const { input, meta, type, ...rest } = props;
    if (type === 'password') {
        return <Input.Password ref={ref} {...input} {...rest} />;
    }
    return <Input ref={ref} {...type?{type}:{}} {...input} {...rest} />;
}

export default React.forwardRef(CharWidget);
