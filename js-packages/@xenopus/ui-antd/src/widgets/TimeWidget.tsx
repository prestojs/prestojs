import { InputProps, WidgetProps } from '@xenopus/ui';
import { TimePicker } from 'antd';
import React from 'react';

// As of 4.0.0-alpha9 antd is still bound to moment.js and its value is a Moment|undefined. we strip value out for typechecking here.
export type TimePickerWidgetInputType = Omit<InputProps<string, HTMLElement>, 'value'>;

export interface TimePickerWidgetProps<FieldValue, T extends HTMLElement>
    extends Omit<WidgetProps<FieldValue, T>, 'input'> {
    input: TimePickerWidgetInputType;
}
/**
 * See [TimePicker](https://next.ant.design/components/time-picker/) for props available
 */
// FIXME - there's no way to pass value to TimePicker correctly w/o moment being involved atm - its not a standard Date object there.
export default function TimeWidget({
    input,
}: TimePickerWidgetProps<string, HTMLElement>): React.ReactElement {
    return <TimePicker {...input} />;
}
