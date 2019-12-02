import { WidgetProps } from '@xenopus/ui';
import { Radio } from 'antd';
import React from 'react';

/**
 * See [Radio](https://next.ant.design/components/radio/) for props available
 */
export default function NullableBooleanWidget({
    input,
}: WidgetProps<boolean | null | undefined, HTMLElement>): React.ReactElement {
    const {
        value,
        choices = [
            [true, 'Yes'],
            [false, 'No'],
            [null, 'Undecided'],
        ],
        ...rest
    } = input;

    return (
        <Radio.Group defaultValue={value} {...rest}>
            {(choices as Array<[boolean | null | undefined, string]>).map(([key, label]): any => (
                <Radio key={key ? key.toString() : '__undefined_key__'} value={key}>
                    {label}
                </Radio>
            ))}
        </Radio.Group>
    );
}
