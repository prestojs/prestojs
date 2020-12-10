import { WidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type NumberWidgetProps = WidgetProps<number, HTMLInputElement>;

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function NumberWidget(
    props: NumberWidgetProps,
    ref: React.RefObject<typeof InputNumber>
): React.ReactElement {
    const { input, ...rest } = props;
    return <InputNumber ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(NumberWidget);
