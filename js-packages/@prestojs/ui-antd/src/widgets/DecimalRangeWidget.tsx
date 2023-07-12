import { RangedWidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';
import React from 'react';
import RangeWidget from './RangeWidget';

function DecimalRangeWidget(
    props: RangedWidgetProps<number, HTMLElement, InputNumberProps>,
    ref: React.RefObject<typeof InputNumber>
): React.ReactElement {
    const { lowerInput = {}, upperInput = {}, separator, input, meta, ...rest } = props;
    const { value } = input;

    const valueNumLower: number | null | undefined =
        value?.lower === undefined || value?.lower === null
            ? input.value?.lower
            : Number(value.lower);
    const valueNumUpper: number | null | undefined =
        value?.upper === undefined || value?.upper === null
            ? input.value?.upper
            : Number(value.upper);

    const refinedInput = {
        ...input,
        value: { lower: valueNumLower, upper: valueNumUpper, bound: value?.bound },
    };

    return (
        <RangeWidget
            ref={ref}
            lowerInput={lowerInput}
            upperInput={upperInput}
            separator={separator}
            inputWidget={InputNumber}
            input={refinedInput}
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
export default React.forwardRef(DecimalRangeWidget) as (
    props: RangedWidgetProps<number, HTMLElement, InputNumberProps>
) => React.ReactElement;
