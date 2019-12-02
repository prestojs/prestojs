import { DatePicker } from 'antd';
import React from 'react';
import { RangedDatePickerWidgetProps } from './DateRangeWidget';

/**
 * See [DatePicker](https://next.ant.design/components/date-picker/) for props available
 *
 * format of this widget will be decided by lowerInput.
 */
export default function DateTimeRangeWidget({
    lowerInput,
    upperInput,
    separator,
}: RangedDatePickerWidgetProps<Date, HTMLElement>): React.ReactElement {
    const { format = 'MMMM Do YYYY, h:mm a', ...restLower } = lowerInput;
    return (
        <>
            <DatePicker showTime format={format} {...restLower} />
            {{ separator }}
            <DatePicker showTime {...upperInput} />
        </>
    );
}
