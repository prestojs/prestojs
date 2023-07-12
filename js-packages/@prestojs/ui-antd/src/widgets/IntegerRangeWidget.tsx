import { RangedWidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';
import React from 'react';
import RangeWidget from './RangeWidget';

function IntegerRangeWidget(
    props: RangedWidgetProps<number, HTMLElement, InputNumberProps>,
    ref: React.RefObject<typeof InputNumber>
): React.ReactElement {
    const { lowerInput = {}, upperInput = {}, separator, meta, ...rest } = props;
    return (
        <RangeWidget
            ref={ref}
            lowerInput={lowerInput}
            upperInput={upperInput}
            separator={separator}
            inputWidget={InputNumber}
            {...rest}
        />
    );
}

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 *
 * As with all range widgets, ref should be shaped as `{ lowerRef: Ref(), upperRef: Ref() }`
 *
 * You may pass in props to be used for the individual input as lowerInput / upperInput
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(IntegerRangeWidget) as (
    props: RangedWidgetProps<number, HTMLElement, InputNumberProps>
) => React.ReactElement;
