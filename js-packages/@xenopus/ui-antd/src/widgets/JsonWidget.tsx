import { WidgetProps } from '@xenopus/ui/FieldWidget';
import React from 'react';
import TextWidget from './TextWidget';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
// FIXME - what kind of widget a json field really wants?
export default function JsonWidget({
    input,
    meta,
}: WidgetProps<string, HTMLElement>): React.ReactElement {
    return <TextWidget {...{ input, meta }} />;
}
