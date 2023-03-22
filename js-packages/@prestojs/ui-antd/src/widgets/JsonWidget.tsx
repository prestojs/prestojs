import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import React, { ComponentProps } from 'react';

/**
 * @expand-properties
 * @hide-properties meta
 */
type JsonWidgetProps = Omit<
    WidgetProps<string | null, HTMLTextAreaElement>,
    'choices' | 'asyncChoices'
> &
    Omit<ComponentProps<typeof Input.TextArea>, 'onChange' | 'value'>;

/**
 * Form widget for JSON values that renders as a [Input.TextArea](https://4x.ant.design/components/input/#Input.TextArea).
 *
 * This is the [default widget](doc:getWidgetForField) used for [JsonField](doc:JsonField)
 *
 * <Usage type="widget" widgetName="JsonWidget">
 * ```js
 * function JsonWidgetExample() {
 * const [value, setValue] = useState("");
 *  return <JsonWidget input={{ onChange({ target: { value } }) {
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
function JsonWidget(props: JsonWidgetProps, ref): React.ReactElement {
    const { input, meta, ...rest } = props;
    const { value, ...restInput } = input;
    return <Input.TextArea ref={ref} value={value ?? ''} {...restInput} {...rest} />;
}

export default React.forwardRef<TextAreaRef, WidgetProps<string, HTMLTextAreaElement>>(JsonWidget);
