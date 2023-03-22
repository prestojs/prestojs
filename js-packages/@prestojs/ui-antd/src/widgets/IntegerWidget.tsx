import React from 'react';
import NumberWidget, { NumberWidgetProps } from './NumberWidget';

/**
 * @expand-properties
 * @hide-properties meta
 */
type IntegerWidgetProps = Omit<NumberWidgetProps<number>, 'precision'>;

/**
 * Form widget for string values that renders as a [InputNumber](https://4x.ant.design/components/input-number/) with
 * a `precision` of `0`.
 *
 * This is the [default widget](doc:getWidgetForField) used for [IntegerField](doc:IntegerField)
 *
 * <Usage type="widget" widgetName="IntegerWidget">
 * ```js
 * function IntegerWidgetExample() {
 * const [value, setValue] = useState(null);
 *  return <IntegerNumberWidget input={{ onChange(nextValue) {
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
function IntegerWidget(
    props: IntegerWidgetProps,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    return <NumberWidget<number> ref={ref} precision={0} {...props} />;
}

export default React.forwardRef(IntegerWidget);
