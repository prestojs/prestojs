/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render } from '@testing-library/react';
import BooleanFormatter from '../formatters/BooleanFormatter';

test('BooleanFormatter', () => {
    expect(render(BooleanFormatter({ value: true })).container.innerHTML).toBe('Yes');
    expect(render(BooleanFormatter({ value: false })).container.innerHTML).toBe('No');
    expect(render(BooleanFormatter({})).container.innerHTML).toBe('');
    expect(render(BooleanFormatter({ blankLabel: 'N/A' })).container.innerHTML).toBe('N/A');
    // @ts-ignore Not part of type but we handle strings and numbers anyway
    expect(render(BooleanFormatter({ value: '', blankLabel: 'N/A' })).container.innerHTML).toBe(
        'N/A'
    );
    // @ts-ignore
    expect(render(BooleanFormatter({ value: 0, blankLabel: 'N/A' })).container.innerHTML).toBe(
        'No'
    );
    expect(render(BooleanFormatter({ value: true, trueLabel: '✅' })).container.innerHTML).toBe(
        '✅'
    );
    expect(render(BooleanFormatter({ value: false, falseLabel: '❌' })).container.innerHTML).toBe(
        '❌'
    );
});
