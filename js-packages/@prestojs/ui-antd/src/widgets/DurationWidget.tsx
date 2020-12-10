import { WidgetProps } from '@prestojs/ui';
import { TimePicker } from 'antd';
import { TimePickerProps } from 'antd/lib/time-picker';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type DurationWidgetProps = WidgetProps<string, HTMLInputElement> & { input: TimePickerProps };

/**
 * See [TimePicker](https://ant.design/components/time-picker/) for props available
 */
function DurationWidget(props: DurationWidgetProps, ref: React.RefObject<any>): React.ReactElement {
    const { input, ...rest } = props;
    return <TimePicker ref={ref} format="HH:mm" {...input} {...rest} />;
}

export default React.forwardRef(DurationWidget);
