import { WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import React, { ComponentProps, RefObject } from 'react';

/**
 * @expandproperties
 * @hideproperties meta
 */
export type JsonWidgetProps = Omit<
    WidgetProps<string | null, HTMLTextAreaElement>,
    'choices' | 'asyncChoices'
> &
    Omit<ComponentProps<typeof Input.TextArea>, 'onChange' | 'value'> & {
        ref?: RefObject<TextAreaRef>;
    };

function JsonWidget(props: Omit<JsonWidgetProps, 'ref'>, ref): React.ReactElement {
    const { input, meta, ...rest } = props;
    const { value, ...restInput } = input;
    return <Input.TextArea ref={ref} value={value ?? ''} {...restInput} {...rest} />;
}

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
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 * @hideproperties meta
 */
export default React.forwardRef(JsonWidget) as (props: JsonWidgetProps) => React.ReactElement;
