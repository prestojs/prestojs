import { RangedWidgetProps } from '@prestojs/ui';
import { DatePicker } from 'antd';
import { DatePickerProps } from 'antd/lib/date-picker';
import React from 'react';
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
function DateRangeWidget(
    props: RangedWidgetProps<Date, HTMLInputElement, DatePickerProps>,
    ref: React.RefObject<DatePickerProps>
): React.ReactElement {
    const { lowerInput, upperInput, separator, ...rest } = props;
    const { format: formatLower = 'YYYY-MM-DD', ...restLower } = lowerInput || {};
    const { format: formatUpper = 'YYYY-MM-DD', ...restUpper } = upperInput || {};

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

export default React.forwardRef(DateRangeWidget);
