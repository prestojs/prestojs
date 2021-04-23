import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type DurationWidgetProps = WidgetProps<string, HTMLInputElement>;

/**
 * See [Input](https://ant.design/components/input/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function DurationWidget(props: DurationWidgetProps, ref: React.RefObject<any>): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <Input ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(DurationWidget);
