import { WidgetProps } from '@prestojs/ui';
import { Input, InputProps, InputRef } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type CharWidgetProps = WidgetProps<string, HTMLInputElement> &
    Omit<InputProps, 'onChange' | 'value'>;

/**
 *
 * See [Input](https://ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function CharWidget(props: CharWidgetProps, ref: React.RefObject<InputRef>): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(CharWidget);
