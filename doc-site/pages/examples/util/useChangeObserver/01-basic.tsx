/**
 * Notify when a value changes
 */
import { useChangeObserver } from '@prestojs/util';
import { Button, message } from 'antd';
import 'antd/dist/antd.css';
import React, { useState } from 'react';

export default function UseAsyncValueSingleExample() {
    const [count, setCount] = useState(0);
    useChangeObserver(count, (prev, next) => {
        message.success(`Value changed from ${prev} to ${next}`);
    });
    return (
        <>
            <p>Count: {count}</p>
            <Button onClick={() => setCount(c => c + 1)}>+1</Button>
            <Button onClick={() => setCount(c => c - 1)}>-1</Button>
        </>
    );
}
