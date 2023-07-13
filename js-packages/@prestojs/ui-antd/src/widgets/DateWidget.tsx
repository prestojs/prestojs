import { WidgetProps } from '@prestojs/ui';
import { DatePickerProps } from 'antd/lib/date-picker';
import React, { RefObject } from 'react';

import { useAntdUiConfig } from '../AntdUiProvider';

/**
 * @expandproperties
 * @hideproperties meta choices asyncChoices
 */
export type DateWidgetProps = WidgetProps<Date, HTMLInputElement> &
    DatePickerProps & {
        ref?: RefObject<HTMLElement>;
    };

function DateWidget(
    props: Omit<DateWidgetProps, 'ref'>,
    ref: React.RefObject<React.ClassicComponent<DatePickerProps, any>>
): React.ReactElement {
    const DatePicker = useAntdUiConfig().getDatePicker();
    const { input, meta, format = 'MMMM Do YYYY', ...rest } = props;
    return <DatePicker ref={ref} format={format} {...input} {...rest} />;
}

/**
 * See [DatePicker](https://ant.design/components/date-picker/) for props available
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(DateWidget) as (props: DateWidgetProps) => React.ReactElement;
