import { DateFormatter } from '@prestojs/ui';
import React from 'react';

export default function Basic() {
    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <DateFormatter value="2020-01-01" />
            <hr />
            <strong>
                Use <code>localeOptions</code> to control format for outputted date
            </strong>
            <DateFormatter
                value="2020-01-01"
                localeOptions={{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }}
                blankLabel={<em>N/A</em>}
            />
            <hr />
            <strong>
                Use <code>locale</code> to control locale used
            </strong>
            <DateFormatter
                value="2020-01-01"
                locales={['de-DE']}
                localeOptions={{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }}
                blankLabel={<em>N/A</em>}
            />
            <hr />
            <strong>
                Use <code>blankLabel</code> to control rendering when no value provided.
            </strong>
            <DateFormatter value={null} blankLabel={<em>N/A</em>} />
            <hr />
            <strong>
                Use <code>invalidDateLabel</code> to control rendering when invalid date provided.
            </strong>
            <DateFormatter value="abcd" invalidDateLabel={<em>Bad date</em>} />
        </div>
    );
}
