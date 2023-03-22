import { WidgetProps } from '@prestojs/ui';
import { Input, InputRef } from 'antd';
import React, { ComponentProps } from 'react';

/**
 * @expand-properties
 * @hide-properties meta
 */
type PasswordWidgetProps = Omit<
    WidgetProps<string | null, HTMLInputElement>,
    'choices' | 'asyncChoices'
> &
    Omit<ComponentProps<typeof Input.Password>, 'onChange' | 'value'>;

/**
 * Form widget for string values that renders as a [Input.Password](https://4x.ant.design/components/input/#Input.Password).
 *
 * This is the [default widget](doc:getWidgetForField) used for [PasswordField](doc:PasswordField)
 *
 * <Usage type="widget" widgetName="PasswordWidget">
 * ```js
 * function PasswordWidgetExample() {
 * const [value, setValue] = useState("");
 *  return <PasswordWidget input={{ onChange({ target: { value } }) {
 *  setValue(value)
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
function PasswordWidget(
    props: PasswordWidgetProps,
    ref: React.RefObject<InputRef>
): React.ReactElement {
    const { input, meta, ...rest } = props;
    const { value, ...restInput } = input;
    return <Input.Password ref={ref} value={value ?? ''} {...restInput} {...rest} />;
}

export default React.forwardRef(PasswordWidget);
