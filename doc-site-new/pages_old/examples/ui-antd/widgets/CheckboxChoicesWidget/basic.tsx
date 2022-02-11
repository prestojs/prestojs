/**
 * Basic Usage
 *
 * Any extra props are passed through to [Radio.Group](https://ant.design/components/checkbox/#Checkbox-Group).
 *
 * Choices are rendered as:
 *
 * ```jsx
 * <Checkbox.Group>
 *     <Radio key="1" value="1">One</Radio>
 *     <Radio key="2" value="2">Two</Radio>
 * </Checkbox.Group>
 * ```
 *
 * You can customise the component used instead of `Radio` by passing `radioComponent` (eg. `radioComponent={RadioChoicesWidget.Button}`).
 *
 * You can pass any extra props to each `Radio` by passing `choiceProps` which is a `Map` of choice value to the props to apply.
 */
import { CheckboxChoicesWidget } from '@prestojs/ui-antd';
import { Checkbox } from 'antd';
import React, { useState } from 'react';

const choices: [string, string][] = [
    ['1', 'One'],
    ['2', 'Two'],
    ['3', 'Three'],
    ['4', 'Four'],
    ['5', 'Five'],
    ['6', 'Six'],
];

export default function BasicExample() {
    const [value, setValues] = useState([]);
    const input = {
        value,
        onChange: values => setValues(values),
    };
    const allChecked = value.length === choices.length;
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <CheckboxChoicesWidget choices={choices} input={input} />
            <hr />
            <strong>
                Use <code>Checkbox</code> with <code>indeterminate</code> to achieve check all
                effect:
            </strong>
            <Checkbox
                indeterminate={value.length > 0 && !allChecked}
                onChange={() => input.onChange(allChecked ? [] : choices.map(([value]) => value))}
                checked={allChecked}
            >
                Check All
            </Checkbox>
            <CheckboxChoicesWidget choices={choices} input={input} />
            <hr />
            <strong>Disabled:</strong>
            <CheckboxChoicesWidget choices={choices} input={input} disabled />
            <hr />
            <strong>Individual choice props</strong>
            <CheckboxChoicesWidget
                choices={choices}
                input={input}
                choiceProps={
                    new Map([
                        ['5', { disabled: true }],
                        ['6', { style: { color: 'red' } }],
                    ])
                }
            />
        </div>
    );
}
