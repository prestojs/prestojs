import { InputProps, WidgetProps } from '@prestojs/ui/FieldWidgetInterface';
import { Select } from 'antd';
import React from 'react';
import { SelectProps } from 'antd/lib/select';

export type SelectChoiceProps = SelectProps<any> &
    WidgetProps<number | string | boolean, HTMLSelectElement> & {
        input: InputProps<number | string | boolean, HTMLSelectElement> & {
            // Types in antd require event. Our types don't because final-form doesn't.
            onBlur: (event: React.FocusEvent<HTMLSelectElement>) => void;
            onFocus: (event: React.FocusEvent<HTMLSelectElement>) => void;
        };
    };

/**
 * See [Select](https://next.ant.design/components/select/) for Select props available
 */
const SelectChoiceWidget = React.forwardRef(
    (
        { input, meta, ...rest }: SelectChoiceProps,
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
