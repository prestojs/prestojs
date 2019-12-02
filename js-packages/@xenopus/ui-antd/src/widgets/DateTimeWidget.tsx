import React from 'react';
import { DatePicker } from 'antd';
import { DatePickerWidgetProps } from './DateWidget';

/**
 * See [DatePicker](https://next.ant.design/components/date-picker/) for props available
 */
export default function DateTimeWidget({
    input,
}: DatePickerWidgetProps<Date, HTMLElement>): React.ReactElement {
    const { format = 'MMMM Do YYYY, h:mm a', ...rest } = input;
    return <DatePicker showTime format={format} {...rest} />;
}
