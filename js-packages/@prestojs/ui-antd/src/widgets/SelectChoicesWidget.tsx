import { InputProps, WidgetProps } from '@prestojs/ui';
import { Select } from 'antd';
import { SelectProps } from 'antd/lib/select';
import { BaseSelectRef } from 'rc-select';
import React, { RefObject } from 'react';

type RawValue = string | number | boolean;

/**
 * @expandproperties
 * @hideproperties asyncChoices
 */
export type SelectChoicesProps<ValueT> = SelectProps<ValueT> &
    Omit<WidgetProps<ValueT, HTMLSelectElement>, 'input' | 'choices'> & {
        /**
         * The choices to render. This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
         */
        input: InputProps<ValueT | null, HTMLSelectElement> & {
            // Types in antd require event. Our types don't because final-form doesn't.
            onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
            onFocus?: (event: React.FocusEvent<HTMLSelectElement>) => void;
        };
        choices: ValueT extends Array<infer T>
            ? Map<T, string> | [T, string][]
            : Map<ValueT, string> | [ValueT, string][];
        ref?: RefObject<BaseSelectRef>;
    };

function SelectChoicesWidget<ValueT extends RawValue | RawValue[]>(
    props: Omit<SelectChoicesProps<ValueT>, 'ref'>,
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

/**
 * See [Select](https://ant.design/components/select/) for Select props available
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(SelectChoicesWidget) as <ValueT extends RawValue | RawValue[]>(
    props: SelectChoicesProps<ValueT>
) => React.ReactElement;
