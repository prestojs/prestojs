import React from 'react';
import DecimalWidget, { DecimalWidgetProps } from './DecimalWidget';
import RangeWidget, { RangeWidgetProps } from './RangeWidget';

/**
 * @expandproperties
 */
export type DecimalRangeWidgetProps = Omit<
    RangeWidgetProps<string, HTMLInputElement, Omit<DecimalWidgetProps, 'input' | 'ref'>>,
    'inputWidget' | 'lowerInput' | 'upperInput'
> & {
    /**
     * Any props you want to pass to the lower input of the range
     */
    lowerInput?: Omit<DecimalWidgetProps, 'input' | 'ref'>;
    /**
     * Any props you want to pass to the upper input of the range
     */
    upperInput?: Omit<DecimalWidgetProps, 'input' | 'ref'>;
};

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 *
 * As with all range widgets, ref should be shaped as `{ lowerRef: Ref(), upperRef: Ref() }`
 *
 * You may pass in props to be used for the individual input as lowerInput / upperInput
 *
 * @extractdocs
 * @menugroup Widgets
 */
export default function DecimalRangeWidget(props: DecimalRangeWidgetProps): React.ReactElement {
    return <RangeWidget {...props} inputWidget={DecimalWidget} />;
}
