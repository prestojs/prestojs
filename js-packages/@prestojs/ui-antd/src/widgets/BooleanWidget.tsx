import { WidgetProps } from '@prestojs/ui';
import { Checkbox } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type BooleanWidgetProps = WidgetProps<boolean, HTMLInputElement>;

/**
 * See [Checkbox](https://ant.design/components/checkbox/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function BooleanWidget(props: BooleanWidgetProps, ref): React.ReactElement {
    const { input, ...rest } = props;
    const { value, ...restInput } = input;
    return <Checkbox ref={ref} checked={!!value} {...restInput} {...rest} />;
}

export default React.forwardRef<HTMLInputElement, WidgetProps<boolean, HTMLInputElement>>(
    BooleanWidget
);
