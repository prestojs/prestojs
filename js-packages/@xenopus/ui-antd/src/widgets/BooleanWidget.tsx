import { WidgetProps } from '@xenopus/ui';
import { Checkbox } from 'antd';
import React from 'react';

/**
 * See [Checkbox](https://next.ant.design/components/checkbox/) for props available
 */
export default function BooleanWidget({
    input,
}: WidgetProps<boolean, HTMLElement>): React.ReactElement {
    const { value, ...rest } = input;
    return <Checkbox checked={!!value} {...rest} />;
}
