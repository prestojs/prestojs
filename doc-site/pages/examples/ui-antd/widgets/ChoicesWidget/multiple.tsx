/**
 * Multiple selection
 *
 * Pass `multiple` through to allow selection of multiple values. In this case the value will
 * be an array.
 *
 * When the number of choices is small (<=3) the default is a checkbox widget, otherwise it
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

export default function MultipleSelectionExample() {
    const [value, setValues] = useState([]);
    const [choices, setChoices] = useState(shortChoices);
    const input = {
        value,
        onChange: values => setValues(values),
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
                <ChoicesWidget choices={choices} multiple input={input} />
                <hr />
                <strong>widgetType: checkbox</strong>
                <ChoicesWidget choices={choices} multiple widgetType="checkbox" input={input} />
                <hr />
                <strong>widgetType: select</strong>
                <ChoicesWidget choices={choices} multiple widgetType="select" input={input} />
                <hr />
                <strong>widgetType: select + search</strong>
                <ChoicesWidget
                    multiple
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
