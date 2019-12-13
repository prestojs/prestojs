import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import NullableBooleanWidget from '../widgets/NullableBooleanWidget';

test('nullable boolean widget takes "null" correctly', async () => {
    const onChange = jest.fn();
    const input = {
        name: 'test',
        onChange,
        onBlur: jest.fn(),
        onFocus: jest.fn(),
    };
    const blankLabel = 'Undecided';
    const { getByText } = render(
        // force open as can't workout how to open it in a test... fireEvent.click()
        // doesn't seem to work to actually open it in a test
        <NullableBooleanWidget input={input} blankLabel={blankLabel} open={true} />
    );
    fireEvent.click(getByText('Yes'));
    expect(onChange).toBeCalledWith(true);

    fireEvent.click(getByText('No'));
    expect(onChange).toBeCalledWith(false);

    fireEvent.click(getByText(blankLabel));
    expect(onChange).toBeCalledWith(null);
});
