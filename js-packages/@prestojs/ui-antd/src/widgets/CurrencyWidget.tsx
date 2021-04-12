import { WidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type CurrencyWidgetProps = WidgetProps<string, HTMLInputElement>;

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function CurrencyWidget(
    props: CurrencyWidgetProps,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    const { input, ...rest } = props;
    const { value, ...restInput } = input;
    const valueNum: number | null | undefined =
        value === undefined || value === null ? value : Number(value);
    return <InputNumber ref={ref} value={valueNum} {...restInput} {...rest} />;
}

export default React.forwardRef(CurrencyWidget);
