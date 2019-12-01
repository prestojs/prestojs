import { InputProps } from '@xenopus/ui/FieldWidget';
import { DatePicker } from 'antd';
import React from 'react';

// Omitting Onchange & Value: as of antd 4.0.9 alpha they're Moment type.
type DateWidgetInputType = Omit<
    Omit<Omit<Omit<InputProps<Date, HTMLElement>, 'onFocus'>, 'onBlur'>, 'onChange'>,
    'value'
> & {
    onFocus: (event: React.FocusEvent<Element>) => void;
    onBlur: (event: React.FocusEvent<Element>) => void;
};

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
// TODO: APPLY BOUNDARY LIMITATION / ADD TIME TO THIS
export default function DateTimeRangeWidget({
    input,
}: {
    input: DateWidgetInputType;
    meta: {};
}): React.ReactElement {
    return <DatePicker {...input} />;
}
