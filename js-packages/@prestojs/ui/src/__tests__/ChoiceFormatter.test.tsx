import { IntegerField } from '@prestojs/viewmodel';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import React from 'react';

import FieldFormatter from '../FieldFormatter';
import ChoiceFormatter from '../formatters/ChoiceFormatter';
import getFormatterForField from '../getFormatterForField';
import UiProvider from '../UiProvider';

test('when supplied a field with choices choice formatter is used and correctly rendered', async () => {
    const choices = new Map([
        [1, 'One'],
        [2, 'Two'],
        [3, 'Three'],
        [4, 'Four'],
    ]);

    const field = new IntegerField({
        label: 'Age',
        choices,
    });

    render(
        <React.Suspense fallback="loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <FieldFormatter field={field} value={2} />
            </UiProvider>
        </React.Suspense>
    );

    const lazyElement = await screen.findByText('Two');
    expect(lazyElement).toBeInTheDocument();
});

test('ChoiceFormatter supports blankLabel', () => {
    const choices = new Map([
        [1, 'One'],
        [2, 'Two'],
        [3, 'Three'],
        [4, 'Four'],
    ]);

    const { getByTestId, rerender } = render(
        <div data-testid="value">
            <ChoiceFormatter value={null} choices={choices} />
        </div>
    );
    expect(getByTestId('value')).toHaveTextContent('');
    rerender(
        <div data-testid="value">
            <ChoiceFormatter value={null} choices={choices} blankLabel="Not Found" />
        </div>
    );
    expect(getByTestId('value')).toHaveTextContent('Not Found');
});

test('ChoiceFormatter supports invalidChoiceLabel', () => {
    const choices = new Map([
        [1, 'One'],
        [2, 'Two'],
        [3, 'Three'],
        [4, 'Four'],
    ]);
    const spy = jest.spyOn(console, 'warn').mockImplementation();

    const { getByTestId, rerender } = render(
        <div data-testid="value">
            <ChoiceFormatter value={5} choices={choices} />
        </div>
    );
    expect(getByTestId('value')).toHaveTextContent('');
    rerender(
        <div data-testid="value">
            <ChoiceFormatter value={5} choices={choices} invalidChoiceLabel="Invalid Choice" />
        </div>
    );
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockReset();
    expect(getByTestId('value')).toHaveTextContent('Invalid Choice');
    rerender(
        <div data-testid="value">
            <ChoiceFormatter
                value={5}
                choices={choices}
                invalidChoiceLabel="Invalid Choice"
                warnOnInvalidChoice={false}
            />
        </div>
    );
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
});
