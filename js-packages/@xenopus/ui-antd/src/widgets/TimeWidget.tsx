import { InputProps } from '@xenopus/ui/FieldWidget';
import { TimePicker } from 'antd';
import React from 'react';

// As of 4.0.0-alpha9 antd is still bound to moment.js and its value is a Moment|undefined. we strip value out for typechecking here.
export type TimeWidgetInputType = Omit<InputProps<string, HTMLElement>, 'value'>;

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
// FIXME - there's no way to pass value to TimePicker correctly w/o moment being involved atm - its not a standard Date object there.
export default function TimeWidget({
    input,
    format,
}: {
    input: TimeWidgetInputType;
    meta: {};
    format?: string;
}): React.ReactElement {
    return <TimePicker format={format} {...input} />;
}
