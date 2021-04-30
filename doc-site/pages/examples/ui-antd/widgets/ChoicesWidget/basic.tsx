/**
 * Basic Usage
 *
 * When the number of choices is small (<=3) the default is a radio widget, otherwise it
 * is a select widget. You can specify the type to use with `widgetType`.
 *
 * Any extra props are passed through to the underlying component (eg. `showSearch` in the last example)
 */
import { ChoicesWidget } from '@prestojs/ui-antd';
import { Switch } from 'antd';
import React, { useState } from 'react';

const shortChoices: [string, string][] = [
    ['1', 'One'],
    ['2', 'Two'],
    ['3', 'Three'],
];
const longChoices: [string, string][] = [
    ...shortChoices,
    ['4', 'Four'],
    ['5', 'Five'],
    ['6', 'Six'],
];

export default function BasicExample() {
    const [value, setValue] = useState(null);
    const [choices, setChoices] = useState(shortChoices);
    const input = {
        value,
        onChange: targetOrValue =>
            setValue(typeof targetOrValue == 'object' ? targetOrValue.target.value : targetOrValue),
    };
    return (
        <>
            <Switch
                checkedChildren="Many Choices"
                unCheckedChildren="Few Choices"
                checked={choices === longChoices}
                onChange={() => setChoices(c => (c === shortChoices ? longChoices : shortChoices))}
            />
            <div className="grid grid-cols-1 gap-4 w-full mt-5">
                <strong>widgetType: (default - based on number of choices)</strong>
                <ChoicesWidget choices={choices} input={input} />
                <hr />
                <strong>widgetType: radio</strong>
                <ChoicesWidget choices={choices} widgetType="radio" input={input} />
                <hr />
                <strong>widgetType: select</strong>
                <hr />
                <ChoicesWidget choices={choices} widgetType="select" input={input} />
                <hr />
                <strong>widgetType: select + search</strong>
                <ChoicesWidget
                    choices={choices}
                    widgetType="select"
                    input={input}
                    showSearch
                    filterOption={(input, option) =>
                        option?.children?.toLowerCase().indexOf(input?.toLowerCase()) >= 0
                    }
                />
            </div>
        </>
    );
}
