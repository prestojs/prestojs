import { WidgetProps } from '@prestojs/ui';
import { Radio } from 'antd';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties asyncChoices
 */
type RadioChoicesWidgetProps = WidgetProps<number | string, HTMLInputElement>;

/**
 * See [Radio](https://ant.design/components/radio/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function RadioChoiceWidget(props: RadioChoicesWidgetProps): React.ReactElement {
    const { input, choices, ...rest } = props;
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
export default RadioChoiceWidget;
