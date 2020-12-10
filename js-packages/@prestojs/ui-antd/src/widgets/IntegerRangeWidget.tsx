import { RangedWidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';
import React from 'react';
import RangeWidget from './RangeWidget';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 *
 * As with all range widgets, ref should be shaped as { lowerRef: Ref(), upperRef: Ref() }
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function IntegerRangeWidget(
    props: RangedWidgetProps<number, HTMLElement, InputNumberProps>,
    ref: React.RefObject<typeof InputNumber>
): React.ReactElement {
    const { lowerInput, upperInput, separator, ...rest } = props;
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

export default React.forwardRef(IntegerRangeWidget);
