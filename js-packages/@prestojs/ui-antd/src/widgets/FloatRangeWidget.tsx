import { RangedWidgetProps } from '@prestojs/ui/FieldWidgetInterface';
import { InputNumber } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';
import React from 'react';
import RangeWidget from './RangeWidget';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 *
 * As with all range widgets, ref should be shaped as { lowerRef: Ref(), upperRef: Ref() }
 */
const FloatRangeWidget = React.forwardRef(
    (
        {
            lowerInput,
            upperInput,
            separator,
            ...rest
        }: RangedWidgetProps<number, HTMLElement, InputNumberProps>,
        ref: React.RefObject<typeof InputNumber>
    ): React.ReactElement => {
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
);

export default FloatRangeWidget;
