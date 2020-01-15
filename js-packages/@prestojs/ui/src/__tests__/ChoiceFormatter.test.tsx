import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntegerField } from '@prestojs/viewmodel';
import '@testing-library/jest-dom/extend-expect';

import FieldFormatter from '../FieldFormatter';
import UiProvider from '../UiProvider';
import getFormatterForField from '../getFormatterForField';

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
