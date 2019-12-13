import React from 'react';
import { WidgetProps } from '@prestojs/ui';
import { DatePicker } from 'antd';
import { DatePickerProps } from 'antd/lib/date-picker/interface';

/**
 * See [DatePicker](https://next.ant.design/components/date-picker/) for props available
 */
const DateTimeWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<Date, HTMLInputElement> & { input: DatePickerProps },
        ref: React.RefObject<React.ClassicComponent<DatePickerProps, any>>
    ): React.ReactElement => {
        const { format = 'MMMM Do YYYY, h:mm a', ...restInput } = input;
        return <DatePicker ref={ref} showTime format={format} {...restInput} {...rest} />;
    }
);

export default DateTimeWidget;
