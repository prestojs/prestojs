/**
 * Basic usage
 */
import { BooleanFormatter } from '@prestojs/ui';
import { Button, Checkbox } from 'antd';
import 'antd/lib/button/style/index.css';
import 'antd/lib/checkbox/style/index.css';
import React, { useState } from 'react';

export default function Basic() {
    const [checked, setChecked] = useState<undefined | boolean>(undefined);
    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <strong>value = true</strong>
            <BooleanFormatter value={true} />
            <hr />
            <strong>value = false</strong>
            <BooleanFormatter value={false} />
            <hr />
            <strong>value = undefined, blankLabel specified</strong>
            <BooleanFormatter blankLabel={<em>None</em>} />
            <hr />
            <strong>custom labels</strong>
            <div>
                <Checkbox onChange={({ target }) => setChecked(target.checked)} checked={checked}>
                    Toggle
                </Checkbox>
                <Button onClick={() => setChecked(undefined)}>Clear value</Button>
            </div>
            <BooleanFormatter blankLabel="❓" trueLabel={'✅'} falseLabel={'❌'} value={checked} />
        </div>
    );
}
