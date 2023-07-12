import { WidgetProps } from '@prestojs/ui';
import { Input, InputProps, InputRef } from 'antd';
import React, { RefObject } from 'react';

/**
 * @expandproperties
 * @hideproperties meta choices asyncChoices checked
 */
export type EmailWidgetProps = WidgetProps<string, HTMLInputElement> &
    Omit<InputProps, 'onChange' | 'value'> & { ref?: RefObject<InputRef> };

function EmailWidget(
    props: Omit<EmailWidgetProps, 'ref'>,
    ref: React.RefObject<InputRef>
): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input type="email" ref={ref} {...input} {...rest} />;
}

/**
 * See [Input](https://ant.design/components/input/) for props available
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(EmailWidget) as (props: EmailWidgetProps) => React.ReactElement;
