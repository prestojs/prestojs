import { InputNumber } from 'antd';
import React from 'react';

/**
 * See [InputNumber](https://ant.design/components/input-number/) for props available
 */
export default function NumberWidget({ value, onChange, ...rest }): React.ReactElement {
    return <InputNumber value={value} onChange={onChange} {...rest} />;
}
