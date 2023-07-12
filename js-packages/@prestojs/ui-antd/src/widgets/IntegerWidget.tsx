import React from 'react';
import NumberWidget, { NumberWidgetProps } from './NumberWidget';

/**
 * @expandproperties
 * @hideproperties meta
 */
export type IntegerWidgetProps = Omit<NumberWidgetProps<number>, 'precision'>;

function IntegerWidget(
    props: Omit<IntegerWidgetProps, 'ref'>,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    return <NumberWidget<number> ref={ref} precision={0} {...props} />;
}
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
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 * @hideproperties meta
 */
export default React.forwardRef(IntegerWidget) as (props: IntegerWidgetProps) => React.ReactElement;
