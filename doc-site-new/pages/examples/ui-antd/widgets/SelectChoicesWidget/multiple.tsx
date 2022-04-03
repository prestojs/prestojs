/**
 * Multiple selection
 *
 * Pass `mode="multiple"` through to allow selection of multiple values. In this case the value will
 * be an array.
 *
 * Any extra props are passed through to the underlying component (eg. `showSearch` in the last example)
 */
import { SelectChoicesWidget } from '@prestojs/ui-antd';
import 'antd/dist/antd.min.css';
import React, { useState } from 'react';

const choices: [string, string][] = [
    ['1', 'One'],
    ['2', 'Two'],
    ['3', 'Three'],
    ['4', 'Four'],
    ['5', 'Five'],
    ['6', 'Six'],
];
export default function MultipleSelectionExample() {
    const [value, setValues] = useState([]);
    const input = {
        value,
        onChange: values => setValues(values),
    };
    return (
        <div className="grid grid-cols-1 gap-4 w-full pb-20">
            <p>
                Filtering is enabled by default when mode="multiple" but it filters on key (eg.
                enter '1' or '5')
            </p>
            <SelectChoicesWidget choices={choices} mode="multiple" input={input} />
            <hr />
            <strong>with custom filtering</strong>
            <SelectChoicesWidget
                mode="multiple"
                choices={choices}
                input={input}
                showSearch
                filterOption={(input, option) =>
                    option?.children?.toLowerCase().indexOf(input?.toLowerCase()) >= 0
                }
            />
        </div>
    );
}
