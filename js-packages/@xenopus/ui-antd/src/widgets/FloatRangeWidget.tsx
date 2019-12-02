import { RangedWidgetProps } from '@xenopus/ui';
import { InputNumber } from 'antd';
import React from 'react';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
export default function FloatRangeWidget({
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
