import { WidgetProps } from '@xenopus/ui';
import { Select } from 'antd';
import React from 'react';
import SelectChoiceWidget from './SelectChoiceWidget';

/**
 * See [Select](https://next.ant.design/components/select/) for Select props available
 */
// Baaah antd still cannot distinguish between null / undefined / '' and now we're stuck with stupid blankValue.
const NullableBooleanWidget = React.forwardRef(
    (
        {
            choices,
            blankLabel = 'Undecided',
            ...rest
        }: WidgetProps<boolean | string, HTMLElement> & {
            blankValue: boolean | string;
            blankLabel: string;
        },
        ref: React.RefObject<Select>
    ): React.ReactElement => {
        const defaultChoices =
            choices ||
            new Map([
                [true, 'Yes'],
                [false, 'No'],
                [null, blankLabel],
            ]);

        const newChoices = new Map(
            Array.from(defaultChoices as any, ([key, label]) =>
                key === null ? ['null', label] : [key, label]
            )
        ) as Map<boolean | string, string>;
        // rest onChange override comes before input onChange.
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const f = rest.onChange || (rest.input as any).onChange;
        const onChange = (v: boolean | string): void => f(v === 'null' ? null : v);

        return <SelectChoiceWidget ref={ref} choices={newChoices} {...{ onChange, ...rest }} />;
    }
);

export default NullableBooleanWidget;
