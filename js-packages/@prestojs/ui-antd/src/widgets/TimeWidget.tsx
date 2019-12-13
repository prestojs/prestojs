import { WidgetProps } from '@prestojs/ui';
import { TimePicker } from 'antd';
import React from 'react';
import { TimePickerProps } from 'antd/lib/time-picker';

/**
 * See [TimePicker](https://next.ant.design/components/time-picker/) for props available
 */
// FIXME - there's no way to pass value to TimePicker correctly w/o moment being involved atm - its not a standard Date object there.
const TimeWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<string, HTMLInputElement> & { input: TimePickerProps },
        ref: React.RefObject<TimePicker>
    ): React.ReactElement => {
        return <TimePicker ref={ref} {...input} {...rest} />;
    }
);

export default TimeWidget;
