/**
 * Basic Usage
 *
 * Any extra props are passed through to [Select](https://ant.design/components/select/)
 */
import { SelectChoicesWidget } from '@prestojs/ui-antd';
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
        onChange: setValue,
    };
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <SelectChoicesWidget choices={choices} input={input} />
            <hr />
            <strong>With filtering</strong>
            <SelectChoicesWidget
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
