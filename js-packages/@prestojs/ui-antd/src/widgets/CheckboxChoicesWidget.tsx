import { WidgetProps } from '@prestojs/ui';
import { Checkbox } from 'antd';
import React, { ComponentProps } from 'react';

type RawValue = string | number | boolean;

/**
 * @expand-properties
 * @hide-properties meta
 */
type CheckboxChoicesWidgetProps<ValueT> = ComponentProps<typeof Checkbox.Group> &
    Omit<WidgetProps<ValueT[], HTMLInputElement, ValueT>, 'choices' | 'asyncChoices'> & {
        /**
         * The choices to render.
         *
         * This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
         *
         * ```js
         * const choices = new Map();
         * choices.set('1', 'One');
         * choices.set('2', 'Two');
         * choices.set('3', 'Three');
         * ```
         *
         * or
         *
         *
         * ```js
         * const choices = [['1', 'One'], ['2', 'Two'], ['3', 'Three']];
         * ```
         */
        choices?: Map<ValueT, string> | [ValueT, string][];
        /**
         * Any additional props to pass through to each choice. These are passed through to the `Checkbox` component.
         *
         * Should be a `Map` of the choice value to the props to pass through
         *
         * ```js
         * <CheckboxChoicesWidget
         *     choices={choices}
         *     input={input}
         *     choiceProps={
         *         new Map([
         *             // Disable the choice '5'
         *             ['5', { disabled: true }],
         *             // Style the choice '6' differently
         *             ['6', { style: { color: 'red' } }],
         *         ])
         *     }
         * />
         * ```
         */

        choiceProps?: Map<ValueT, ComponentProps<typeof Checkbox>>;
    };

/**
 * Renders choices as a group of checkboxes using [Checkbox.Group](https://ant.design/components/checkbox/#Checkbox-Group)
 *
 * This widget isn't used by default for choices but can be selected for fields that use
 * [ChoicesWidget](doc:ChoicesWidget) by passing `widgetType="checkbox"`. For example if
 * you have a field `MyModel.fields.choicesField` then using [Form.Item](doc:FormItem) you
 * can use this widget like:
 *
 * ```js
 * <Form.Item field={MyModel.fields.choicesField} fieldProps={{ widgetType: 'checkbox' }} />
 * ```
 *
 * <Usage type="widget" widgetName="CheckboxChoicesWidget">
 * ```js
 * function CheckboxChoicesWidgetExample() {
 *     const [value, setValues] = useState([]);
 *     const choices = [
 *         ['1', 'One'],
 *         ['2', 'Two'],
 *         ['3', 'Three'],
 *     ];
 *
 *     return (
 *         <CheckboxChoicesWidget
 *             choices={choices}
 *             input={{
 *                 value,
 *                 onChange: values => setValues(values),
 *             }}
 *         />
 *     );
 * }
 * ```
 * </Usage>
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function CheckboxChoicesWidget<ValueT extends RawValue>(
    props: CheckboxChoicesWidgetProps<ValueT>
): React.ReactElement {
    const { input, choices, meta, choiceProps, ...rest } = props;
    if (!choices) {
        throw new Error('choices must be provided');
    }
    return (
        <Checkbox.Group {...rest} {...input}>
            {Array.from(choices, ([value, label]) => (
                <Checkbox key={value.toString()} value={value} {...(choiceProps?.get(value) || {})}>
                    {label}
                </Checkbox>
            ))}
        </Checkbox.Group>
    );
}

// Note that Checkbox.Group doesn't support ref so we don't use forwardRef here
export default CheckboxChoicesWidget;
