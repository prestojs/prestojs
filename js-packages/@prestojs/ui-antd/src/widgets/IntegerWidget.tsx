import { WidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type IntegerWidgetProps = WidgetProps<number, HTMLInputElement> &
    Omit<InputNumberProps, 'onChange' | 'value'>;

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function IntegerWidget(
    props: IntegerWidgetProps,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <InputNumber ref={ref} precision={0} {...rest} {...input} />;
}

export default React.forwardRef(IntegerWidget);
