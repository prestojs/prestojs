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
        /**
         * Any additional props to pass through to each choice. These are passed through to the `Checkbox` component.
         *
         * Should be a `Map` of the choice value to the props to pass through
         */

        choiceProps?: Map<ValueT, Record<string, any>>;
    };

/**
 * Render choices as a group of checkboxes.
 *
 * See [Checkbox.Group](https://ant.design/components/checkbox/#Checkbox-Group) for extra props available
 *
 * To pass props through to the individual `Checkbox` use `choiceProps`.
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function CheckboxChoicesWidget<ValueT extends (number | string)[]>(
    props: CheckboxChoicesWidgetProps<ValueT extends Array<infer T> ? T : unknown>
): React.ReactElement {
    const { input, choices, meta, choiceProps, ...rest } = props;
    if (!choices) {
        throw new Error('choices must be provided');
    }
    return (
        <Checkbox.Group {...input} {...rest}>
            {Array.from(choices, ([value, label]) => (
                <Checkbox key={value} value={value} {...(choiceProps?.get(value) || {})}>
                    {label}
                </Checkbox>
            ))}
        </Checkbox.Group>
    );
}

// Note that Checkbox.Group doesn't support ref so we don't use forwardRef here
export default CheckboxChoicesWidget;
