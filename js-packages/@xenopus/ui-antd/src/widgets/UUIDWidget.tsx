import { WidgetProps } from '@xenopus/ui/FieldWidget';
import React from 'react';
import CharWidget from './CharWidget';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
export default function UUIDWidget({
    input,
    meta,
}: WidgetProps<string, HTMLElement>): React.ReactElement {
    return <CharWidget {...{ input, meta }} />;
}
