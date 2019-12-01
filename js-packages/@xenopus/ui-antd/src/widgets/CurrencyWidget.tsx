import { WidgetProps } from '@xenopus/ui/FieldWidget';
import React from 'react';
import DecimalWidget from './DecimalWidget';

/**
 * See [Input](https://next.ant.design/components/input/) for props available
 */
// TODO - We might want to add currency type support to this field one day.
// TODO - do we want to limit currency decimal points to 2? there ARE countries in the world where 2's not enough eg CLF...
export default function CurrencyWidget({
    input,
    meta,
}: WidgetProps<string, HTMLElement>): React.ReactElement {
    return <DecimalWidget {...{ input, meta }} />;
}
