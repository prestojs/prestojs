import { render } from '@testing-library/react';
import React from 'react';
import TimeFormatter from '../formatters/TimeFormatter';

test('TimeFormatter format times correctly', () => {
    expect(render(<TimeFormatter value={null} />).container.innerHTML).toBe('');
    expect(render(<TimeFormatter value={null} blankLabel="None" />).container.innerHTML).toBe(
        'None'
    );
    expect(render(<TimeFormatter value="1" />).container.innerHTML).toBe('');
    expect(
        render(<TimeFormatter value="1" invalidValueLabel="Bad Time" />).container.innerHTML
    ).toBe('Bad Time');
    expect(render(<TimeFormatter value="11:30" />).container.innerHTML).toBe('11:30:00 AM');
    expect(render(<TimeFormatter value="22:30:55" />).container.innerHTML).toBe('10:30:55 PM');
    expect(
        render(
            <TimeFormatter
                value="11:30:00.000+09:30"
                localeOptions={{ timeStyle: 'short', timeZone: 'Australia/Adelaide' }}
            />
        ).container.innerHTML
    ).toBe('11:30 AM');

    expect(
        render(
            <TimeFormatter
                value="11:30:00.000+09:30"
                localeOptions={{ timeStyle: 'short', timeZone: 'Australia/Melbourne' }}
            />
        ).container.innerHTML
    ).toBe('12:00 PM');

    expect(
        render(
            <TimeFormatter
                value={new Date(Date.parse('1970-01-01T06:16:35.720+04:00'))}
                localeOptions={{ timeStyle: 'short', timeZone: 'Australia/Melbourne' }}
            />
        ).container.innerHTML
    ).toBe('12:16 PM');
});
