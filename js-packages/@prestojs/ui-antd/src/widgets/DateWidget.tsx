import { WidgetProps } from '@prestojs/ui';
import { DatePicker } from 'antd';
import { DatePickerProps } from 'antd/lib/date-picker';

import React from 'react';

/**
 * See [DatePicker](https://next.ant.design/components/date-picker/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
const DateWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<Date, HTMLInputElement> & { input: DatePickerProps },
        ref: React.RefObject<React.ClassicComponent<DatePickerProps, any>>
    ): React.ReactElement => {
        const { format = 'MMMM Do YYYY', ...restInput } = input;
        return <DatePicker ref={ref} format={format} {...restInput} {...rest} />;
    }
);

export default DateWidget;
