/**
 * Basic Usage
 *
 * Any extra props are passed through to [Checkbox](https://ant.design/components/checkbox/#API)
 * except for `checked` which is set by `BooleanWidget` based on `value`.
 */
import { BooleanWidget } from '@prestojs/ui-antd';
import 'antd/es/checkbox/style/index.css';
import React, { useState } from 'react';

export default function BasicExample() {
    const [value, setValue] = useState<boolean | null>(null);
    const input = {
        value,
        onChange: ({ target: { checked } }) => setValue(checked),
    };
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <BooleanWidget input={input} />
            <p>Value: {value != null ? value.toString() : <em>(null)</em>}</p>
        </div>
    );
}
