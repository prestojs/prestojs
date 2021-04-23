import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type TextWidgetProps = WidgetProps<string, HTMLTextAreaElement>;
/**
 * See [Input.TextArea](https://ant.design/components/input/#Input.TextArea) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function TextWidget(props: TextWidgetProps, ref): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input.TextArea ref={ref} {...input} {...rest} />;
}

export default React.forwardRef<TextAreaRef, WidgetProps<string, HTMLTextAreaElement>>(TextWidget);
