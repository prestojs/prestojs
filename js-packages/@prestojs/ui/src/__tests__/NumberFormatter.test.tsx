import { render } from 'presto-testing-library';
import React from 'react';
import NumberFormatter from '../formatters/NumberFormatter';

test('NumberFormatter format numbers correctly', () => {
    expect(render(<NumberFormatter value={null} />).container.innerHTML).toBe('');
    expect(render(<NumberFormatter value={1} />).container.innerHTML).toBe('1');
    expect(render(<NumberFormatter value={0.69} />).container.innerHTML).toBe('0.69');

    expect(render(<NumberFormatter value="42" />).container.innerHTML).toBe('42');
    expect(render(<NumberFormatter value="ulururu" />).container.innerHTML).toBe('');
    expect(render(<NumberFormatter value={5000} />).container.innerHTML).toBe('5,000');

    expect(
        render(
            <NumberFormatter
                value={5000}
                localeOptions={{ style: 'currency', currency: 'USD', currencyDisplay: 'code' }}
            />
        ).container.innerHTML
    ).toBe('USD&nbsp;5,000.00');
});

test('NumberFormatter should support blankLabel & invalidValueLabel', () => {
    expect(render(<NumberFormatter />).container.innerHTML).toBe('');
    expect(render(<NumberFormatter value="" blankLabel="-" />).container.innerHTML).toBe('-');
    expect(render(<NumberFormatter value="bad" />).container.innerHTML).toBe('');
    expect(
        render(<NumberFormatter value="bad" invalidValueLabel="Bad Number" />).container.innerHTML
    ).toBe('Bad Number');
});
