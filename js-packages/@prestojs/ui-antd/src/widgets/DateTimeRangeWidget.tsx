import { RangedWidgetProps } from '@prestojs/ui';
import { DatePickerProps } from 'antd/lib/date-picker';
import React from 'react';

import { useAntdUiConfig } from '../AntdUiProvider';
import RangeWidget from './RangeWidget';

/**
 * See [DatePicker](https://ant.design/components/date-picker/) for props available
 *
 * As with all range widgets, ref should be shaped as { lowerRef: Ref(), upperRef: Ref() }
 *
 * You may pass in props to be used for the individual input as lowerInput / upperInput
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function DateTimeRangeWidget(
    {
        lowerInput,
        upperInput,
        separator,
        meta,
        ...rest
    }: RangedWidgetProps<Date, HTMLInputElement, DatePickerProps>,
    ref: React.RefObject<DatePickerProps>
): React.ReactElement {
    const { format: formatLower = 'MMMM Do YYYY, h:mm a', ...restLower } = lowerInput || {};
    const { format: formatUpper = 'MMMM Do YYYY, h:mm a', ...restUpper } = upperInput || {};
    const DatePicker = useAntdUiConfig().getDatePicker();
    const lower = { ...{ format: formatLower, ...restLower } };
    const upper = { ...{ format: formatUpper, ...restUpper } };

    return (
        <RangeWidget
            ref={ref}
            lowerInput={lower}
            upperInput={upper}
            separator={separator}
            inputWidget={DatePicker}
            {...rest}
        />
    );
}

export default React.forwardRef<
    DatePickerProps,
    RangedWidgetProps<Date, HTMLInputElement, DatePickerProps>
>(DateTimeRangeWidget);
