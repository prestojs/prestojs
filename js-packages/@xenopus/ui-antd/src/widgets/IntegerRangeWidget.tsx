import { InputNumber } from 'antd';
import React from 'react';
import { RangedWidgetProps } from '@xenopus/ui';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
export default function IntegerRangeWidget({
    lowerInput,
    upperInput,
    separator,
}: RangedWidgetProps<number, HTMLElement>): React.ReactElement {
    return (
        <>
            <InputNumber {...lowerInput} />
            {{ separator }}
            <InputNumber {...upperInput} />
        </>
    );
}
