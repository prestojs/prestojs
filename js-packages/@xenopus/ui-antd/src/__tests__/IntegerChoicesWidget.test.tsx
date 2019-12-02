import React from 'react';
import { mount } from 'enzyme';

import IntegerChoicesWidget from '../widgets/IntegerChoicesWidget';

test('choices widget picks select / radio base on choice number correctly', () => {
    const choices = new Map([
        [1, 'One'],
        [2, 'One One'],
    ]);
    const choicesLong = new Map([
        [1, 'One'],
        [2, 'One One'],
        [3, 'One One One'],
        [4, 'One One One One'],
    ]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const wrapper = mount(<IntegerChoicesWidget choices={choicesLong} />);
    expect(wrapper.find('.ant-radio-group').length).toBe(0);
    expect(wrapper.find('.ant-select').length).toBe(1);
    wrapper.setProps({ choices });
    expect(wrapper.find('.ant-radio-group').length).toBe(1);
    expect(wrapper.find('.ant-select').length).toBe(0);
});
