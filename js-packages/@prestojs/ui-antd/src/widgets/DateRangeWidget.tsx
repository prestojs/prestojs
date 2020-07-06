import { RangedWidgetProps } from '@prestojs/ui';
import { DatePicker } from 'antd';
import { DatePickerProps } from 'antd/lib/date-picker';
import React from 'react';
import RangeWidget from './RangeWidget';

/**
 * See [DatePicker](https://next.ant.design/components/date-picker/) for props available
 *
 * As with all range widgets, ref should be shaped as { lowerRef: Ref(), upperRef: Ref() }
 */
const DateRangeWidget = React.forwardRef(
    (
        {
            lowerInput,
            upperInput,
            separator,
            ...rest
        }: RangedWidgetProps<Date, HTMLInputElement, DatePickerProps>,
        ref: React.RefObject<DatePickerProps>
    ): React.ReactElement => {
        const { format: formatLower = 'MMMM Do YYYY', ...restLower } = lowerInput;
        const { format: formatUpper = 'MMMM Do YYYY', ...restUpper } = upperInput;

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
);

export default DateRangeWidget;
