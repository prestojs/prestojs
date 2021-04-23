import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type JsonWidgetProps = WidgetProps<string, HTMLTextAreaElement>;
/**
 * See [Input.TextArea](https://ant.design/components/input/#Input.TextArea) for props available
 *
 * Renders as a TextArea
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function JsonWidget(props: JsonWidgetProps, ref): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input.TextArea ref={ref} {...input} {...rest} />;
}

export default React.forwardRef<TextAreaRef, WidgetProps<string, HTMLTextAreaElement>>(JsonWidget);
