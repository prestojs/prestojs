import { WidgetProps } from '@prestojs/ui';
import { Input, InputRef } from 'antd';
import React, { ComponentProps, RefObject } from 'react';

/**
 * @expandproperties
 * @hideproperties meta
 */
export type PasswordWidgetProps = Omit<
    WidgetProps<string | null, HTMLInputElement>,
    'choices' | 'asyncChoices'
> &
    Omit<ComponentProps<typeof Input.Password>, 'onChange' | 'value'> & {
        ref?: RefObject<InputRef>;
    };

function PasswordWidget(
    props: Omit<PasswordWidgetProps, 'ref'>,
    ref: React.RefObject<InputRef>
): React.ReactElement {
    const { input, meta, ...rest } = props;
    const { value, ...restInput } = input;
    return <Input.Password ref={ref} value={value ?? ''} {...restInput} {...rest} />;
}

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
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 * @hideproperties meta
 */
export default React.forwardRef(PasswordWidget) as (
    props: PasswordWidgetProps
) => React.ReactElement;
