import React from 'react';
import NumberWidget, { NumberWidgetProps } from './NumberWidget';

/**
 * @expand-properties
 * @hide-properties meta
 */
type DecimalWidgetProps = Omit<NumberWidgetProps<string>, 'stringMode'>;

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
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 * @hide-properties meta
 */
function DecimalWidget(
    props: DecimalWidgetProps,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    return <NumberWidget<string> ref={ref} stringMode {...props} />;
}

export default React.forwardRef(DecimalWidget);
