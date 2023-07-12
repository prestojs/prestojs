import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import React, { RefObject } from 'react';

/**
 * @expandproperties
 * @hideproperties choices asyncChoices
 */
export type TextWidgetProps = WidgetProps<string, HTMLTextAreaElement> & {
    ref?: RefObject<TextAreaRef>;
};

function TextWidget(props: Omit<TextWidgetProps, 'ref'>, ref): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input.TextArea ref={ref} {...input} {...rest} />;
}

/**
 * See [Input.TextArea](https://ant.design/components/input/#Input.TextArea) for props available
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(TextWidget) as (props: TextWidgetProps) => React.ReactElement;
