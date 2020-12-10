import type { WidgetProps } from '@prestojs/ui';
import React from 'react';
import SelectChoiceWidget, { SelectChoiceProps } from './SelectChoiceWidget';

type NullableBooleanWidgetProps = WidgetProps<boolean | string, HTMLSelectElement> & {
    blankLabel: string;
} & SelectChoiceProps;

/**
 * See [Select](https://next.ant.design/components/select/) for Select props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
const NullableBooleanWidget = React.forwardRef<HTMLSelectElement, NullableBooleanWidgetProps>(
    (
        { choices, blankLabel = 'Undecided', ...rest }: NullableBooleanWidgetProps,
        ref
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
        const f = rest.onChange || (rest.input as any).onChange;
        const onChange = (v: boolean | string): void => f(v === 'null' ? null : v);

        return <SelectChoiceWidget ref={ref} choices={newChoices} {...{ onChange, ...rest }} />;
    }
);

export default NullableBooleanWidget;
