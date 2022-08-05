import { WidgetProps } from '@prestojs/ui';
import { Checkbox } from 'antd';
import React, { ComponentProps } from 'react';

/**
 *
 * @expand-properties
 * @hide-properties meta
 */
type BooleanWidgetProps = Omit<
    WidgetProps<boolean | null, HTMLInputElement>,
    'choices' | 'asyncChoices'
> &
    Omit<ComponentProps<typeof Checkbox>, 'checked'>;

/**
 * Form widget for boolean values that renders as a [Checkbox](https://ant.design/components/checkbox/).
 *
 * This is the [default widget](doc:getWidgetForField) used for [BooleanField](doc:BooleanField)
 *
 * <Usage type="widget" widgetName="BooleanWidget">
 * ```js
 * function BooleanWidgetExample() {
 * const [value, setValue] = useState(false);
 *  return <BooleanWidget input={{ onChange({ target: { checked } }) {
 *  setValue(checked)
 * }, value}} />
 * }
 * ```
 * </Usage>
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function BooleanWidget(props: BooleanWidgetProps, ref): React.ReactElement {
    const { input, meta, ...rest } = props;
    const { value, ...restInput } = input;
    return <Checkbox ref={ref} {...restInput} {...rest} checked={!!value} />;
}

export default React.forwardRef(BooleanWidget);
