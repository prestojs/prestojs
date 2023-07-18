import { WidgetProps } from '@prestojs/ui';
import type { DatePickerProps } from 'antd/lib/date-picker';
import React, { RefObject } from 'react';

import { useAntdUiConfig } from '../AntdUiProvider';

/**
 * @expandproperties
 * @hideproperties meta choices asyncChoices
 */
export type DateTimeWidgetProps = WidgetProps<Date, HTMLInputElement> &
    DatePickerProps & {
        ref?: RefObject<HTMLElement>;
    };

function DateTimeWidget(
    props: Omit<DateTimeWidgetProps, 'ref'>,
    ref: React.RefObject<React.ClassicComponent<DatePickerProps, any>>
): React.ReactElement {
    const DatePicker = useAntdUiConfig().getDatePicker();
    const { input, meta, format = 'MMMM Do YYYY, h:mm a', ...rest } = props;
    return <DatePicker ref={ref} showTime format={format} {...input} {...rest} />;
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
