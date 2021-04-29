import { WidgetProps } from '@prestojs/ui';
import { Radio } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties asyncChoices
 */
type RadioChoicesWidgetProps<ValueT> = WidgetProps<ValueT, HTMLInputElement> & {
    /**
     * The choices to render. This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
     */
    choices: Map<ValueT, string> | [ValueT, string][];
};

/**
 * See [Radio](https://ant.design/components/radio/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function RadioChoicesWidget<ValueT extends number | string>(
    props: RadioChoicesWidgetProps<ValueT>
): React.ReactElement {
    const { input, choices, meta, ...rest } = props;
    return (
        <Radio.Group {...input} {...rest}>
            {choices &&
                Array.from(choices, ([key, label]) => (
                    <Radio key={key.toString()} value={key}>
                        {label}
                    </Radio>
                ))}
        </Radio.Group>
    );
}

// Note that Radio.Group doesn't support ref so we don't use forwardRef here
export default RadioChoicesWidget;
