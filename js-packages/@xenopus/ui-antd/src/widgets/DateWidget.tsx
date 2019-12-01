import { InputProps } from '@xenopus/ui/FieldWidget';
import { DatePicker } from 'antd';
import React from 'react';

// Omitting Onchange & Value: as of antd 4.0.9 alpha they're Moment type.
export type DateWidgetInputType = Omit<
    Omit<Omit<Omit<InputProps<Date, HTMLElement>, 'onFocus'>, 'onBlur'>, 'onChange'>,
    'value'
> & {
    onFocus: (event: React.FocusEvent<Element>) => void;
    onBlur: (event: React.FocusEvent<Element>) => void;
};

/**
 * See [DatePicker](https://next.ant.design/components/date-picker/) for props available
 */
export default function DateWidget({
    input,
    showTime,
    format,
    meta: {},
}: {
    input: DateWidgetInputType;
    showTime?: boolean;
    format?: string;
    meta: {};
}): React.ReactElement {
    const defaultFormat = showTime ? 'MMMM Do YYYY, h:mm a' : 'MMMM Do YYYY';
    const finalFormat = format ? format : defaultFormat;
    return <DatePicker showTime={showTime} format={finalFormat} {...input} />;
}
