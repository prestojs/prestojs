import { NumberField } from '@prestojs/viewmodel';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import React from 'react';
import getWidgetForField from '../getWidgetForField';

test('getWidgetForField should return widget for field', async () => {
    const fieldArgs = { label: 'input number with a spin button' };
    const UnknownWidget = getWidgetForField(new NumberField(fieldArgs)) as any;

    render(
        <React.Suspense fallback="loading...">
            <UnknownWidget />
        </React.Suspense>
    );

    expect(await screen.findByText('loading...')).toBeInTheDocument();
    const lazyElement = await screen.findByRole('spinbutton');
    expect(lazyElement).toBeInTheDocument();
});

test('getWidgetForField should return widget for descendant classes of same type', async () => {
    class CustomDecimal extends NumberField {}

    const fieldArgs = { label: 'input number with a spin button' };
    const UnknownWidget = getWidgetForField(new CustomDecimal(fieldArgs)) as any;

    render(
        <React.Suspense fallback="loading...">
            <UnknownWidget />
        </React.Suspense>
    );

    const lazyElement = await screen.findByRole('spinbutton');
    expect(lazyElement).toBeInTheDocument();
});
