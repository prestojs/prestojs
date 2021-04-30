import { render } from '@testing-library/react';
import React from 'react';
import DateTimeFormatter from '../formatters/DateTimeFormatter';

test('DateTimeFormatter should format values', () => {
    expect(render(<DateTimeFormatter value="2020-01-01T11:00:00" />).container.innerHTML).toBe(
        '1/1/2020, 11:00:00 AM'
    );
    expect(
        render(
            <DateTimeFormatter
                value="2020-01-01T11:00:00"
                localeOptions={{
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                }}
            />
        ).container.innerHTML
    ).toBe('Wednesday, January 1, 2020, 11:00 AM');
    expect(render(<DateTimeFormatter value="" />).container.innerHTML).toBe('');
    expect(render(<DateTimeFormatter value="" blankLabel="-" />).container.innerHTML).toBe('-');
    expect(render(<DateTimeFormatter value="bad" invalidDateLabel="" />).container.innerHTML).toBe(
        ''
    );
    expect(
        render(<DateTimeFormatter value="bad" invalidDateLabel="Bad Date" />).container.innerHTML
    ).toBe('Bad Date');
});
