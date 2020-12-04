import { WidgetProps } from '@prestojs/ui';
import { Radio } from 'antd';
import React from 'react';

/**
 * See [Radio](https://next.ant.design/components/radio/) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function RadioChoiceWidget({
    input,
    ...rest
}: WidgetProps<number | string, HTMLInputElement>): React.ReactElement {
    return (
        <Radio.Group {...input} {...rest}>
            {rest.choices &&
                Array.from(rest.choices, ([key, label]) => (
                    <Radio key={key.toString()} value={key}>
                        {label}
                    </Radio>
                ))}
        </Radio.Group>
    );
}

// Note that Radio.Group doesn't support ref so we don't use forwardRef here
export default RadioChoiceWidget;
