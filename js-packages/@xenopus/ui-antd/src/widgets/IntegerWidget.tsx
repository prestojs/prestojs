import { WidgetProps } from '@xenopus/ui/FieldWidget';
import React from 'react';
import NumberWidget from './NumberWidget';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
export default function IntegerWidget({
    input,
    meta,
}: WidgetProps<number, HTMLElement>): React.ReactElement {
    return <NumberWidget {...{ input, meta }} />;
}
