import React from 'react';
import DateWidget, { DateWidgetInputType } from './DateWidget';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
export default function DateTimeWidget({
    input,
    format,
    meta,
}: {
    input: DateWidgetInputType;
    format?: string;
    meta: {};
}): React.ReactElement {
    return <DateWidget showTime format={format} {...{ input, meta }} />;
}
