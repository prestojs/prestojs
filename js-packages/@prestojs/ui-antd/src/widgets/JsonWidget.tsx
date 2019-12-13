import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import React from 'react';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
// FIXME - what kind of widget a json field really wants?
const JsonWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<string, HTMLTextAreaElement>,
        ref: React.RefObject<TextArea>
    ): React.ReactElement => {
        return <Input.TextArea ref={ref} {...input} {...rest} />;
    }
);

export default JsonWidget;
