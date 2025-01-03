/**
 * Basic Usage
 *
 * Any extra props are passed through to [InputNumber](https://4x.ant.design/components/input-number/).
 */
import { DecimalWidget } from '@prestojs/ui-antd';
import 'antd/es/input-number/style/index.css';
import React, { useState } from 'react';

export default function BasicExample() {
    const [value, setValue] = useState<string | null>(null);
    const input = {
        value,
        onChange: nextValue => setValue(nextValue),
    };
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <DecimalWidget input={input} />
            <p>Value: {value != null ? value || <em>(empty string)</em> : <em>Not set</em>}</p>
        </div>
    );
}
