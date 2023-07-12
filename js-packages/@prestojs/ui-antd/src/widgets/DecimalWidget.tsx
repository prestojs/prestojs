import React from 'react';
import NumberWidget, { NumberWidgetProps } from './NumberWidget';

/**
 * @expandproperties
 * @hideproperties meta
 */
export type DecimalWidgetProps = Omit<NumberWidgetProps<string>, 'stringMode'>;

function DecimalWidget(
    props: Omit<DecimalWidgetProps, 'ref'>,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    return <NumberWidget<string> ref={ref} stringMode {...props} />;
}
/**
 * Form widget for string values that renders as a [InputNumber](https://4x.ant.design/components/input-number/) with
 * `stringMode` enabled.
 *
 * This is the [default widget](doc:getWidgetForField) used for [DecimalField](doc:DecimalField)
 *
 * <Usage type="widget" widgetName="DecimalWidget">
 * ```js
 * function DecimalWidgetExample() {
 * const [value, setValue] = useState(null);
 *  return <DecimalNumberWidget input={{ onChange(nextValue) {
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
export default React.forwardRef(DecimalWidget) as (props: DecimalWidgetProps) => React.ReactElement;
