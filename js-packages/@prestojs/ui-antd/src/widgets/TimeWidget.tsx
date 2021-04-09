import { WidgetProps } from '@prestojs/ui';
import { TimePickerProps } from 'antd/lib/time-picker';
import React from 'react';

import { useAntdUiConfig } from '../AntdUiProvider';

/**
 * @expand-properties
 * @hide-properties choices asyncChoices
 */
type TimeWidgetProps = WidgetProps<string, HTMLInputElement> & { input: TimePickerProps };
/**
 * See [TimePicker](https://ant.design/components/time-picker/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
// FIXME - there's no way to pass value to TimePicker correctly w/o moment being involved atm - its not a standard Date object there.
// ref as RefObject any cause TimePicker's merged as a value in antd unlike any other
function TimeWidget(props: TimeWidgetProps, ref: React.RefObject<any>): React.ReactElement {
    const TimePicker = useAntdUiConfig().getTimePicker();
    const { input, ...rest } = props;

    return <TimePicker ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(TimeWidget);
