import { WidgetProps } from '@xenopus/ui';
import { Select } from 'antd';
import React from 'react';
import { SelectProps } from 'antd/lib/select';

/**
 * See [Select](https://next.ant.design/components/select/) for Select props available
 */
const SelectChoiceWidget = React.forwardRef(
    (
        {
            input,
            ...rest
        }: WidgetProps<number | string | boolean, HTMLSelectElement> & { input: SelectProps<any> },
        ref: React.RefObject<Select>
    ): React.ReactElement => {
        return (
            <Select ref={ref} {...input} {...rest}>
                {rest.choices &&
                    Array.from(rest.choices, ([key, label]) => (
                        <Select.Option key={key.toString()} value={key as any}>
                            {label}
                        </Select.Option>
                    ))}
            </Select>
        );
    }
);

export default SelectChoiceWidget;
