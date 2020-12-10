import { WidgetProps } from '@prestojs/ui';
import { DatePicker } from 'antd';
import { DatePickerProps } from 'antd/lib/date-picker';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type DateTimeWidgetProps = WidgetProps<Date, HTMLInputElement> & { input: DatePickerProps };

/**
 * See [DatePicker](https://ant.design/components/date-picker/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function DateTimeWidget(
    props: DateTimeWidgetProps,
    ref: React.RefObject<React.ClassicComponent<DatePickerProps, any>>
): React.ReactElement {
    const { input, ...rest } = props;
    const { format = 'MMMM Do YYYY, h:mm a', ...restInput } = input;
    // antd 4.0.0-rc5 has a bug in DatePickerProps in that it does not have showTime taking boolean as type atm (object only)
    // revisit to see if we still need this ignore once its released
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return <DatePicker ref={ref} showTime format={format} {...restInput} {...rest} />;
}

export default React.forwardRef(DateTimeWidget);
