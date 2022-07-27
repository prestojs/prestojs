import { CharFormatter } from '@prestojs/ui';
import React from 'react';

export default function Basic() {
    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <strong>Value passed</strong>
            <CharFormatter value="Test Value" />
            <hr />
            <strong>
                No value; uses <code>blankLabel</code>
            </strong>
            <CharFormatter blankLabel="❓" />
        </div>
    );
}
