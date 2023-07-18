import React from 'react';
import FloatWidget, { FloatWidgetProps } from './FloatWidget';
import RangeWidget, { RangeWidgetProps } from './RangeWidget';

/**
 * @expandproperties
 */
export type FloatRangeWidgetProps = Omit<
    RangeWidgetProps<number, HTMLInputElement, Omit<FloatWidgetProps, 'input' | 'ref'>>,
    'inputWidget' | 'lowerInput' | 'upperInput'
> & {
    /**
     * Any props you want to pass to the lower input of the range
     */
    lowerInput?: Omit<FloatWidgetProps, 'input' | 'ref'>;
    /**
     * Any props you want to pass to the upper input of the range
     */
    upperInput?: Omit<FloatWidgetProps, 'input' | 'ref'>;
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
export default function FloatRangeWidget(props: FloatRangeWidgetProps): React.ReactElement {
    return <RangeWidget {...props} inputWidget={FloatWidget} />;
}
