import React from 'react';
import NumberWidget, { NumberWidgetProps } from './NumberWidget';

/**
 * @expand-properties
 * @hide-properties meta
 */
type FloatWidgetProps = NumberWidgetProps<number>;

/**
 * Form widget for string values that renders as a [InputNumber](https://4x.ant.design/components/input-number/).
 *
 * This is the [default widget](doc:getWidgetForField) used for [FloatField](doc:FloatField)
 *
 * <Usage type="widget" widgetName="FloatWidget">
 * ```js
 * function FloatWidgetExample() {
 * const [value, setValue] = useState(null);
 *  return <FloatNumberWidget input={{ onChange(nextValue) {
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
function FloatWidget(
    props: FloatWidgetProps,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    return <NumberWidget<number> ref={ref} {...props} />;
}

export default React.forwardRef(FloatWidget);
