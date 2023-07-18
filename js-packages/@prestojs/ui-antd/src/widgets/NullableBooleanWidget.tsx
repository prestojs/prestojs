import type { WidgetProps } from '@prestojs/ui';
import React from 'react';
import SelectChoicesWidget, { SelectChoicesProps } from './SelectChoicesWidget';

/**
 * @expandproperties
 * @hideproperties asyncChoices
 */
export type NullableBooleanWidgetProps = WidgetProps<boolean | string, HTMLSelectElement> & {
    /**
     * Label to use to represent the blank (null) value.
     *
     * Defaults to 'Undecided'.
     */
    blankLabel: string;
} & Omit<SelectChoicesProps<boolean | string>, 'choices'>;

function NullableBooleanWidget(
    props: Omit<NullableBooleanWidgetProps, 'ref'>,
    ref
): React.ReactElement {
    const { choices, blankLabel = 'Undecided', meta, input, ...rest } = props;
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
    const onChange = (v: boolean | string): void => input.onChange(v === 'null' ? null : v);

    return (
        <SelectChoicesWidget
            ref={ref}
            // @ts-ignore
            choices={newChoices}
            input={{ ...input, onChange }}
            {...rest}
        />
    );
}
/**
 * See [Select](https://ant.design/components/select/) for Select props available
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(NullableBooleanWidget) as (
    props: NullableBooleanWidgetProps
) => React.ReactElement;
