import { Modal } from '@prestojs/doc';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'doc/Modal',
    component: Modal,
    args: {
        title: '',
        isVisible: true,
    },
} as ComponentMeta<typeof Modal>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
export const AllSimpleTypes: ComponentStory<typeof Modal> = args => <Modal {...args}>Hello</Modal>;
