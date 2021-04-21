import type { WidgetProps } from '@prestojs/ui';
import React from 'react';
import SelectChoiceWidget, { SelectChoiceProps } from './SelectChoiceWidget';

/**
 * @expand-properties
 * @hide-properties asyncChoices
 */
type NullableBooleanWidgetProps = WidgetProps<boolean | string, HTMLSelectElement> & {
    /**
     * Label to use to represent the blank (null) value.
     *
     * Defaults to 'Undecided'.
     */
    blankLabel: string;
} & SelectChoiceProps;

/**
 * See [Select](https://ant.design/components/select/) for Select props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function NullableBooleanWidget(props: NullableBooleanWidgetProps, ref): React.ReactElement {
    const { choices, blankLabel = 'Undecided', meta, ...rest } = props;
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

export default React.forwardRef<HTMLSelectElement, NullableBooleanWidgetProps>(
    NullableBooleanWidget
);
