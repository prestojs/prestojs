import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import React from 'react';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
// FIXME - what kind of widget a json field really wants?
const JsonWidget = React.forwardRef<TextAreaRef, WidgetProps<string, HTMLTextAreaElement>>(
    ({ input, ...rest }: WidgetProps<string, HTMLTextAreaElement>, ref): React.ReactElement => {
        return <Input.TextArea ref={ref} {...input} {...rest} />;
    }
);

export default JsonWidget;
