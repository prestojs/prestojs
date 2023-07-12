import { WidgetProps } from '@prestojs/ui';
import type { DatePickerProps } from 'antd/lib/date-picker';
import React, { RefObject } from 'react';

import { useAntdUiConfig } from '../AntdUiProvider';

/**
 * @expandproperties
 * @hideproperties meta choices asyncChoices
 */
type DateTimeWidgetProps = WidgetProps<Date, HTMLInputElement> & {
    input: DatePickerProps;
    ref?: RefObject<HTMLElement>;
};

function DateTimeWidget(
    props: Omit<DateTimeWidgetProps, 'ref'>,
    ref: React.RefObject<React.ClassicComponent<DatePickerProps, any>>
): React.ReactElement {
    const DatePicker = useAntdUiConfig().getDatePicker();
    const { input, meta, ...rest } = props;
    const { format = 'MMMM Do YYYY, h:mm a', ...restInput } = input;
    // antd 4.0.0-rc5 has a bug in DatePickerProps in that it does not have showTime taking boolean as type atm (object only)
    // revisit to see if we still need this ignore once its released
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return <DatePicker ref={ref} showTime format={format} {...restInput} {...rest} />;
}

/**
 * See [DatePicker](https://ant.design/components/date-picker/) for props available
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(DateTimeWidget) as (
    props: DateTimeWidgetProps
) => React.ReactElement;
