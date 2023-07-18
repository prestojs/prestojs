import { WidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import React, { ComponentProps, RefObject } from 'react';

type ValueType = string | number;

/**
 * @expandproperties
 * @hideproperties meta
 */
export type NumberWidgetProps<T extends ValueType = ValueType> = Omit<
    WidgetProps<T | null, HTMLInputElement>,
    'choices' | 'asyncChoices'
> &
    Omit<ComponentProps<typeof InputNumber>, 'onChange' | 'value'> & {
        ref?: RefObject<HTMLInputElement>;
    };

function NumberWidget<T extends ValueType = number>(
    props: Omit<NumberWidgetProps<T>, 'ref'>,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <InputNumber ref={ref} {...input} {...rest} />;
}

/**
 * Form widget for string values that renders as a [InputNumber](https://4x.ant.design/components/input-number/).
 *
 * This is the [default widget](doc:getWidgetForField) used for [NumberField](doc:NumberField)
 *
 * <Usage type="widget" widgetName="NumberWidget">
 * ```js
 * function NumberWidgetExample() {
 * const [value, setValue] = useState(null);
 *  return <NumberWidget input={{ onChange(nextValue) {
 *  setValue(nextValue)
 * }, value}} />
 * }
 * ```
 * </Usage>
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 * @hideproperties meta
 */
export default React.forwardRef(NumberWidget) as <T extends ValueType = number>(
    props: NumberWidgetProps<T>
) => React.ReactElement;
