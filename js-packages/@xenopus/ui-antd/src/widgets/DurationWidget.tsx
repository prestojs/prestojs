import React from 'react';
import TimeWidget, { TimeWidgetInputType } from './TimeWidget';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
export default function DurationWidgt({
    input,
    meta,
}: {
    input: TimeWidgetInputType;
    meta: {};
}): React.ReactElement {
    return <TimeWidget {...{ input, meta }} />;
}
