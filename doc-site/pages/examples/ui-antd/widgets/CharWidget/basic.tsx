/**
 * Basic Usage
 *
 * Any extra props are passed through to [Input](https://ant.design/components/input/#API).
 */
import { CharWidget } from '@prestojs/ui-antd';
import 'antd/es/input/style/index.css';
import React, { useState } from 'react';

export default function BasicExample() {
    const [value, setValue] = useState<string | null>(null);
    const input = {
        value,
        onChange: ({ target: { value } }) => setValue(value),
    };
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <CharWidget input={input} />
            <p>
                Value:{' '}
                {value != null ? value.toString() || <em>(empty string)</em> : <em>Not set</em>}
            </p>
        </div>
    );
}
