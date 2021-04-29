import { InputProps, WidgetProps } from '@prestojs/ui';
import { Select } from 'antd';
import { SelectProps } from 'antd/lib/select';
import React from 'react';

type RawValue = string | number | boolean;

/**
 * @expand-properties
 * @hide-properties asyncChoices
 */
export type SelectChoicesProps<ValueT> = SelectProps<ValueT> &
    WidgetProps<ValueT, HTMLSelectElement> & {
        /**
         * The choices to render. This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
         */
        choices: ValueT extends Array<infer T>
            ? Map<T, string> | [T, string][]
            : Map<ValueT, string> | [ValueT, string][];
        input: InputProps<ValueT, HTMLSelectElement> & {
            // Types in antd require event. Our types don't because final-form doesn't.
            onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
            onFocus?: (event: React.FocusEvent<HTMLSelectElement>) => void;
        };
    };

/**
 * See [Select](https://ant.design/components/select/) for Select props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function SelectChoicesWidget<ValueT extends RawValue | RawValue[]>(
    props: SelectChoicesProps<ValueT>,
    ref
): React.ReactElement {
    const { input, meta, choices, ...rest } = props;
    return (
        <Select ref={ref} {...rest} {...input}>
            {Array.from(choices, ([key, label]) => (
                <Select.Option key={key.toString()} value={key as any}>
                    {label}
                </Select.Option>
            ))}
        </Select>
    );
}

export default React.forwardRef(SelectChoicesWidget);
