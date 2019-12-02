import { WidgetProps } from '@xenopus/ui';
import { Select } from 'antd';
import React from 'react';

/**
 * See [Select](https://next.ant.design/components/select/) for props available
 */
export default function IntegerChoicesWidget({
    input,
}: WidgetProps<number, HTMLElement>): React.ReactElement {
    const { value, choices, ...rest } = input;

    return (
        <Select defaultValue={value} {...rest}>
            {(choices as Array<[number, string]>).map(([key, label]): any => (
                <Select.Option key={key} value={key}>
                    {label}
                </Select.Option>
            ))}
        </Select>
    );
}
