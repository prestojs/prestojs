import { BooleanFormatter } from '@prestojs/ui';
import { Checkbox } from 'antd';
import React, { useState } from 'react';

export default function Basic() {
    const [checked, setChecked] = useState<boolean>();
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
            <Checkbox onChange={({ target }) => setChecked(target.checked)} checked={checked}>
                Toggle
            </Checkbox>
            <BooleanFormatter blankLabel="❓" trueLabel={'✅'} falseLabel={'❌'} value={checked} />
        </div>
    );
}
