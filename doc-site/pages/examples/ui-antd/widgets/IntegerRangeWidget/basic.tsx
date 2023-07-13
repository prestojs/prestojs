/**
 * Basic Usage
 */
import { IntegerRangeWidget } from '@prestojs/ui-antd';
import 'antd/dist/antd.css';
import React, { useState } from 'react';

export default function BasicExample() {
    const [value, setValue] = useState<{ lower?: number; upper?: number }>({});
    const input = {
        value,
        onChange: value => setValue(value),
    };
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <IntegerRangeWidget input={input} />
            <p>Value: {value != null ? JSON.stringify(value, null, 2) : <em>(null)</em>}</p>
        </div>
    );
}
