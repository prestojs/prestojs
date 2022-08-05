import { WidgetProps } from '@prestojs/ui';
import { Input, InputRef } from 'antd';
import React, { ComponentProps } from 'react';

/**
 * @expand-properties
 * @hide-properties meta
 */
type CharWidgetProps = Omit<
    WidgetProps<string | null, HTMLInputElement>,
    'choices' | 'asyncChoices'
> &
    Omit<ComponentProps<typeof Input>, 'onChange' | 'value'>;

/**
 * Form widget for string values that renders as a [Input](https://ant.design/components/input/).
 *
 * This is the [default widget](doc:getWidgetForField) used for [CharField](doc:CharField)
 *
 * <Usage type="widget" widgetName="CharWidget">
 * ```js
 * function CharWidgetExample() {
 * const [value, setValue] = useState("");
 *  return <CharWidget input={{ onChange({ target: { value } }) {
 *  setValue(value)
 * }, value}} />
 * }
 * ```
 * </Usage>
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 *@hide-properties meta
 */
function CharWidget(props: CharWidgetProps, ref: React.RefObject<InputRef>): React.ReactElement {
    const { input, meta, ...rest } = props;
    const { value, ...restInput } = input;
    return <Input ref={ref} value={value ?? ''} {...restInput} {...rest} />;
}

export default React.forwardRef(CharWidget);
