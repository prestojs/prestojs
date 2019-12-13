import { WidgetProps } from '@prestojs/ui';
import { Radio } from 'antd';
import RadioGroup from 'antd/lib/radio/group';
import React from 'react';

/**
 * See [Radio](https://next.ant.design/components/radio/) for props available
 */
const RadioChoiceWidget = React.forwardRef(
    (
        { input, ...rest }: WidgetProps<number | string, HTMLInputElement>,
        ref: React.RefObject<RadioGroup>
    ): React.ReactElement => {
        return (
            <Radio.Group ref={ref} {...input} {...rest}>
                {rest.choices &&
                    Array.from(rest.choices, ([key, label]) => (
                        <Radio key={key.toString()} value={key}>
                            {label}
                        </Radio>
                    ))}
            </Radio.Group>
        );
    }
);

export default RadioChoiceWidget;
