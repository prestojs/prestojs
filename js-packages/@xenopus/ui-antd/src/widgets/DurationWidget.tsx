import { TimePicker } from 'antd';
import React from 'react';
import { TimePickerWidgetProps } from './TimeWidget';

/**
 * See [TimePicker](https://next.ant.design/components/time-picker/) for props available
 */
// FIXME - there's nqo way to pass value to TimePicker correctly w/o moment being involved atm - its not a standard Date object there.
export default function DurationWidget({
    input,
}: TimePickerWidgetProps<string, HTMLElement>): React.ReactElement {
    return <TimePicker format="HH:mm" {...input} />;
}
