import { DateTimeFormatter } from '@prestojs/ui';
import React from 'react';

export default function Basic() {
    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <DateTimeFormatter value="2020-05-01T11:35:00" />
            <hr />
            <strong>
                Use <code>localeOptions</code> to control format for outputted date
            </strong>
            <DateTimeFormatter
                value="2020-05-01T11:35:00"
                localeOptions={{
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                }}
                blankLabel={<em>N/A</em>}
            />
            <hr />
            <strong>
                Use <code>locale</code> to control locale used
            </strong>
            <DateTimeFormatter
                value="2020-05-01T11:35:00"
                locales={['de-DE']}
                localeOptions={{
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                }}
                blankLabel={<em>N/A</em>}
            />
            <hr />
            <strong>
                Use <code>blankLabel</code> to control rendering when no value provided.
            </strong>
            <DateTimeFormatter value={null} blankLabel={<em>N/A</em>} />
            <hr />
            <strong>
                Use <code>invalidDateLabel</code> to control rendering when invalid date provided.
            </strong>
            <DateTimeFormatter value="abcd" invalidDateLabel={<em>Bad date</em>} />
        </div>
    );
}
