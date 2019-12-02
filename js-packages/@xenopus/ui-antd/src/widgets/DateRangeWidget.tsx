import { RangedWidgetProps } from '@xenopus/ui';
import { DatePicker } from 'antd';
import React from 'react';
import { DatePickerWidgetInputType } from './DateWidget';

export interface RangedDatePickerWidgetProps<FieldValue, T extends HTMLElement>
    extends Omit<RangedWidgetProps<FieldValue, T>, 'lowerInput' | 'upperInput'> {
    lowerInput: DatePickerWidgetInputType;
    upperInput: DatePickerWidgetInputType;
    separator: string;
}

/**
 * See [DatePicker](https://next.ant.design/components/date-picker/) for props available
 *
 * format of this widget will be decided by lowerInput.
 */
export default function DateRangeWidget({
    lowerInput,
    upperInput,
    separator,
}: RangedDatePickerWidgetProps<Date, HTMLElement>): React.ReactElement {
    const { format = 'MMMM Do YYYY', ...restLower } = lowerInput;
    return (
        <>
            <DatePicker format={format} {...restLower} />
            {{ separator }}
            <DatePicker {...upperInput} />
        </>
    );
}
