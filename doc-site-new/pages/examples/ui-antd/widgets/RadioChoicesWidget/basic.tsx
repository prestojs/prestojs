/**
 * Basic Usage
 *
 * Any extra props are passed through to [Radio.Group](https://ant.design/components/radio/#RadioGroup).
 *
 * Choices are rendered as:
 *
 * ```jsx
 * <Radio.Group>
 *     <Radio key="1" value="1">One</Radio>
 *     <Radio key="2" value="2">Two</Radio>
 * </Radio.Group>
 * ```
 *
 * You can customise the component used instead of `Radio` by passing `radioComponent` (eg. `radioComponent={RadioChoicesWidget.Button}`).
 *
 * You can pass any extra props to each `Radio` by passing `choiceProps` which is a `Map` of choice value to the props to apply.
 */
import { RadioChoicesWidget } from '@prestojs/ui-antd';
import 'antddd/dist/antd.min.css';
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
    const [value, setValue] = useState(null);
    const input = {
        value,
        onChange: targetOrValue =>
            setValue(typeof targetOrValue == 'object' ? targetOrValue.target.value : targetOrValue),
    };
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <RadioChoicesWidget choices={choices} input={input} />
            <hr />
            <strong>Render as buttons</strong>
            <RadioChoicesWidget
                choices={choices}
                input={input}
                buttonStyle="solid"
                radioComponent={RadioChoicesWidget.Button}
            />
            <hr />
            <strong>Pass props to specific choices</strong>
            <RadioChoicesWidget
                choices={choices}
                input={input}
                buttonStyle="solid"
                radioComponent={RadioChoicesWidget.Button}
                choiceProps={
                    new Map([
                        ['3', { disabled: true }],
                        ['5', { style: { color: 'red' } }],
                    ])
                }
            />
        </div>
    );
}
