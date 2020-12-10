import { WidgetProps } from '@prestojs/ui';
import { DatePicker } from 'antd';
import { DatePickerProps } from 'antd/lib/date-picker';

import React from 'react';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type DateWidgetProps = WidgetProps<Date, HTMLInputElement> & { input: DatePickerProps };

/**
 * See [DatePicker](https://ant.design/components/date-picker/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function DateWidget(
    props: DateWidgetProps,
    ref: React.RefObject<React.ClassicComponent<DatePickerProps, any>>
): React.ReactElement {
    const { input, ...rest } = props;
    const { format = 'MMMM Do YYYY', ...restInput } = input;
    return <DatePicker ref={ref} format={format} {...restInput} {...rest} />;
}

export default React.forwardRef(DateWidget);
