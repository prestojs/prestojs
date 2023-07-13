import React from 'react';
import IntegerWidget, { IntegerWidgetProps } from './IntegerWidget';
import RangeWidget, { RangeWidgetProps } from './RangeWidget';

/**
 * @expandproperties
 */
export type IntegerRangeWidgetProps = Omit<
    RangeWidgetProps<number, HTMLInputElement, Omit<IntegerWidgetProps, 'input' | 'ref'>>,
    'inputWidget' | 'lowerInput' | 'upperInput'
> & {
    /**
     * Any props you want to pass to the lower input of the range
     */
    lowerInput?: Omit<IntegerWidgetProps, 'input' | 'ref'>;
    /**
     * Any props you want to pass to the upper input of the range
     */
    upperInput?: Omit<IntegerWidgetProps, 'input' | 'ref'>;
};

/**
 * A range widget for integer values
 *
 * You may pass in props to be used for the individual input as lowerInput / upperInput.
 * See [InputNumber](https://ant.design/components/input-number/) for props available.
 *
 * @extractdocs
 * @menugroup Widgets
 */
export default function IntegerRangeWidget(props: IntegerRangeWidgetProps): React.ReactElement {
    return <RangeWidget {...props} inputWidget={IntegerWidget} />;
}
