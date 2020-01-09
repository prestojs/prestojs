import React from 'react';
import getWidgetForField from '../getWidgetForField';
import { NumberField } from '@prestojs/viewmodel';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

test('getWidgetForField should return widget for field', async() => {
    const fieldArgs = {label: 'input number with a spin button'};
    const UnknownWidget = getWidgetForField(new NumberField(fieldArgs)) as any;

    render(
        <React.Suspense fallback="loading...">
            <UnknownWidget />
        </React.Suspense>
    );

    const lazyElement = await screen.findByRole('spinbutton');
    expect(lazyElement).toBeInTheDocument();
});

test('getWidgetForField should return widget for descendant classes of same type', async() => {
    class CustomDecimal extends NumberField {}

    const fieldArgs = {label: 'input number with a spin button'};
    const UnknownWidget = getWidgetForField(new CustomDecimal(fieldArgs)) as any;

    render(
        <React.Suspense fallback="loading...">
            <UnknownWidget/>
        </React.Suspense>
    );

    const lazyElement = await screen.findByRole('spinbutton');
    expect(lazyElement).toBeInTheDocument();
});
