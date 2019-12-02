import { InputProps, WidgetProps } from '@xenopus/ui';
import { DatePicker } from 'antd';
import React from 'react';

// Omitting Onchange & Value: as of antd 4.0.9 alpha they're Moment type.
export type DatePickerWidgetInputType = Omit<
    InputProps<Date, HTMLElement>,
    'onFocus' | 'onBlur' | 'onChange' | 'value'
> & {
    onFocus: (event: React.FocusEvent<Element>) => void;
    onBlur: (event: React.FocusEvent<Element>) => void;
    format?: string;
};

export interface DatePickerWidgetProps<FieldValue, T extends HTMLElement>
    extends Omit<WidgetProps<FieldValue, T>, 'input'> {
    input: DatePickerWidgetInputType;
}

/**
 * See [DatePicker](https://next.ant.design/components/date-picker/) for props available
 */
export default function DateWidget({
    input,
}: DatePickerWidgetProps<Date, HTMLElement>): React.ReactElement {
    const { format = 'MMMM Do YYYY', ...rest } = input;
    return <DatePicker format={format} {...rest} />;
}
