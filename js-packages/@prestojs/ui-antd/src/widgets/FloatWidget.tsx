import { WidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type FloatWidgetProps = WidgetProps<number, HTMLInputElement>;

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function FloatWidget(
    props: FloatWidgetProps,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    const { input, ...rest } = props;
    return <InputNumber ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(FloatWidget);
