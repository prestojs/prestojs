import React from 'react';
import NumberWidget, { NumberWidgetProps } from './NumberWidget';

/**
 * @expandproperties
 * @hideproperties meta
 */
export type FloatWidgetProps = NumberWidgetProps<number>;

function FloatWidget(
    props: Omit<FloatWidgetProps, 'ref'>,
    ref: React.RefObject<HTMLInputElement>
): React.ReactElement {
    return <NumberWidget<number> ref={ref} {...props} />;
}
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
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 * @hideproperties meta
 */
export default React.forwardRef(FloatWidget) as (props: FloatWidgetProps) => React.ReactElement;
