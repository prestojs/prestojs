import { WidgetProps } from '@prestojs/ui';
import { TimePickerProps } from 'antd/lib/time-picker';
import React, { RefObject } from 'react';

import { useAntdUiConfig } from '../AntdUiProvider';

/**
 * @expandproperties
 * @hideproperties choices asyncChoices
 */
export type TimeWidgetProps = WidgetProps<string, HTMLInputElement> & {
    input: TimePickerProps;
    ref?: RefObject<any>;
};
// FIXME - there's no way to pass value to TimePicker correctly w/o moment being involved atm - its not a standard Date object there.
// ref as RefObject any cause TimePicker's merged as a value in antd unlike any other
function TimeWidget(props: TimeWidgetProps, ref: React.RefObject<any>): React.ReactElement {
    const TimePicker = useAntdUiConfig().getTimePicker();
    const { input, meta, ...rest } = props;

    return <TimePicker ref={ref} {...input} {...rest} />;
}

/**
 * See [TimePicker](https://ant.design/components/time-picker/) for props available
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(TimeWidget) as (props: TimeWidgetProps) => React.ReactElement;
