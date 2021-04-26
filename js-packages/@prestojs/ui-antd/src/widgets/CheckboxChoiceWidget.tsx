import { WidgetProps } from '@prestojs/ui';
import { Checkbox } from 'antd';
import type { CheckboxGroupProps } from 'antd/es/checkbox';
import React from 'react';

/**
 * @expand-properties
 * @hide-properties asyncChoices
 */
type CheckboxChoicesWidgetProps<ValueT extends number | string> = CheckboxGroupProps &
    WidgetProps<ValueT[], HTMLInputElement, ValueT> & {
        /**
         * The choices to render.
         *
         * This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
         */
        choices?: Map<ValueT, string> | [ValueT, string][];
    };

/**
 * See [Checkbox.Group](https://ant.design/components/checkbox/#Checkbox-Group) for other props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function CheckboxChoiceWidget<ValueT extends (number | string)[]>(
    props: CheckboxChoicesWidgetProps<ValueT extends Array<infer T> ? T : unknown>
): React.ReactElement {
    const { input, choices, meta, ...rest } = props;
    if (!choices) {
        throw new Error('choices must be provided');
    }
    return (
        <Checkbox.Group
            {...input}
            options={Array.from(choices, ([value, label]) => ({ value, label }))}
            {...rest}
        />
    );
}

// Note that Checkbox.Group doesn't support ref so we don't use forwardRef here
export default CheckboxChoiceWidget;
