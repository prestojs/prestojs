import { WidgetProps } from '@prestojs/ui';
import { InputNumber } from 'antd';
import React, { ComponentProps } from 'react';

type ValueType = string | number;

/**
 * @expand-properties
 * @hide-properties meta
 */
export type NumberWidgetProps<T extends ValueType = ValueType> = Omit<
    WidgetProps<T | null, HTMLInputElement>,
    'choices' | 'asyncChoices'
> &
    Omit<ComponentProps<typeof InputNumber>, 'onChange' | 'value'>;

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
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 * @hide-properties meta
 */
function NumberWidget<T extends ValueType = number>(
    props: NumberWidgetProps<T>,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    const { input, meta, ...rest } = props;
    return <InputNumber ref={ref} {...input} {...rest} />;
}

export default React.forwardRef(NumberWidget) as <T extends ValueType = number>(
    props: NumberWidgetProps<T>,
    ref: React.RefObject<HTMLInputElement>
) => React.ReactElement;
