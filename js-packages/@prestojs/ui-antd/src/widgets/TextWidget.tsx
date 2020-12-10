import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import React from 'react';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
const TextWidget = React.forwardRef<TextAreaRef, WidgetProps<string, HTMLTextAreaElement>>(
    ({ input, ...rest }: WidgetProps<string, HTMLTextAreaElement>, ref): React.ReactElement => {
        return <Input.TextArea ref={ref} {...input} {...rest} />;
    }
);

export default TextWidget;
