import { WidgetProps } from '@xenopus/ui';
import { Input } from 'antd';
import React from 'react';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
export default function URLWidget({ input }: WidgetProps<string, HTMLElement>): React.ReactElement {
    return <Input {...input} />;
}
