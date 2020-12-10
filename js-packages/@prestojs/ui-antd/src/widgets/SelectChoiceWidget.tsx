import { InputProps, WidgetProps } from '@prestojs/ui';
import { Select } from 'antd';
import { SelectProps } from 'antd/lib/select';
import React from 'react';

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
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
const SelectChoiceWidget = React.forwardRef<HTMLSelectElement, SelectChoiceProps>(
    ({ input, meta, ...rest }: SelectChoiceProps, ref): React.ReactElement => {
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
