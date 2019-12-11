import React from 'react';
import { mount } from 'enzyme';

import NullableBooleanWidget from '../widgets/NullableBooleanWidget';

test('nullable boolean widget takes "null" correctly', async () => {
    const onChange = jest.fn();
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const wrapper = mount(<NullableBooleanWidget input={{ onChange }} />);
    wrapper
        .find('Select')
        .get(0)
        .props.onChange(true);
    expect(onChange).toBeCalledWith(true);

    wrapper
        .find('Select')
        .get(0)
        .props.onChange(false);
    expect(onChange).toBeCalledWith(false);

    wrapper
        .find('Select')
        .get(0)
        .props.onChange(null);
    expect(onChange).toBeCalledWith(null);

    wrapper
        .find('Select')
        .get(0)
        .props.onChange('null');
    expect(onChange).toBeCalledWith(null);
});
