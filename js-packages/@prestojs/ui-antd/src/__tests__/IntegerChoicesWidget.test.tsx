import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';

import IntegerChoicesWidget from '../widgets/IntegerChoicesWidget';

test('choices widget picks select / radio base on choice number correctly', async () => {
    const choices = new Map([
        [1, 'One'],
        [2, 'Two'],
    ]);
    const choicesLong = new Map([
        [1, 'One'],
        [2, 'Two'],
        [3, 'Three'],
        [4, 'Four'],
    ]);
    const onChange = jest.fn();
    const input = {
        name: 'test',
        onChange,
        onBlur: jest.fn(),
        onFocus: jest.fn(),
    };
    const { rerender, container, getByText, getByLabelText } = render(
        // open is a valid prop for SelectChoices but IntegerChoicesWidget doesn't specify...
        // complicated because it is only valid when type is Select not when Radio. I'm ignoring
        // this for now
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        <IntegerChoicesWidget choices={choicesLong} input={input} open />
    );
    expect(container.querySelectorAll('.ant-radio-group').length).toBe(0);
    expect(container.querySelectorAll('.ant-select').length).toBe(1);
    await waitFor(() => getByText('One'));
    fireEvent.click(getByText('One'));
    expect(onChange).toHaveBeenCalledWith(1, expect.anything());
    fireEvent.click(getByText('Three'));
    expect(onChange).toHaveBeenCalledWith(3, expect.anything());
    rerender(<IntegerChoicesWidget choices={choices} input={input} />);
    expect(container.querySelectorAll('.ant-radio-group').length).toBe(1);
    expect(container.querySelectorAll('.ant-select').length).toBe(0);
    fireEvent.click(getByLabelText('Two'));
    expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ target: expect.objectContaining({ value: 2 }) })
    );
});
