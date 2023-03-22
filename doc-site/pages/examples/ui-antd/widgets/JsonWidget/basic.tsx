/**
 * Basic Usage
 *
 * Any extra props are passed through to [Input](https://ant.design/components/input/#API).
 */
import { JsonFormatter } from '@prestojs/ui';
import { JsonWidget } from '@prestojs/ui-antd';
import 'antd/es/input/style/index.css';
import React, { useState } from 'react';

export default function BasicExample() {
    const [value, setValue] = useState<string | null>(null);
    const input = {
        value,
        onChange: ({ target: { value } }) => setValue(value),
    };
    let parsedValue = null;
    try {
        parsedValue = typeof value == 'string' ? JSON.parse(value) : value;
    } catch (e) {}

    console.log(value);
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <JsonWidget input={input} />
            <p>Value: {parsedValue ? <JsonFormatter value={parsedValue} /> : 'Invalid JSON'}</p>
        </div>
    );
}
