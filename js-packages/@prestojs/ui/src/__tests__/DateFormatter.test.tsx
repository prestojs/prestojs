import { render } from '@testing-library/react';
import React from 'react';
import DateFormatter from '../formatters/DateFormatter';

test('DateFormatter should format values', () => {
    expect(render(<DateFormatter value="2020-01-01" />).container.innerHTML).toBe('1/1/2020');
    expect(
        render(
            <DateFormatter
                value="2020-01-01"
                localeOptions={{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }}
            />
        ).container.innerHTML
    ).toBe('Wednesday, January 1, 2020');
    expect(render(<DateFormatter value="" />).container.innerHTML).toBe('');
    expect(render(<DateFormatter value="" blankLabel="-" />).container.innerHTML).toBe('-');
    expect(render(<DateFormatter value="bad" invalidDateLabel="" />).container.innerHTML).toBe('');
    expect(
        render(<DateFormatter value="bad" invalidDateLabel="Bad Date" />).container.innerHTML
    ).toBe('Bad Date');
});
