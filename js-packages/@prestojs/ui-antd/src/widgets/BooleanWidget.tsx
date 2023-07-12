import { WidgetProps } from '@prestojs/ui';
import { Checkbox } from 'antd';
import type { CheckboxRef } from 'rc-checkbox';
import React, { ComponentProps, RefObject } from 'react';

/**
 * @expandproperties
 * @hideproperties meta
 */
export type BooleanWidgetProps = Omit<
    WidgetProps<boolean | null, HTMLInputElement>,
    'choices' | 'asyncChoices'
> &
    Omit<ComponentProps<typeof Checkbox>, 'checked' | 'ref'> & {
        // This differs to type on Checkbox but that type appears to be wrong - actual ref is CheckboxRef not HTMLInputElement
        ref?: RefObject<CheckboxRef>;
    };

function BooleanWidget(
    props: Omit<BooleanWidgetProps, 'ref'>,
    ref: RefObject<CheckboxRef>
): React.ReactElement {
    const { input, meta, ...rest } = props;
    const { value, checked, ...restInput } = input;
    // If checked is provided use that otherwise use value. react-final-form will
    // set `checked` but only if Field is passed type="checkbox"
    return <Checkbox ref={ref as any} {...restInput} {...rest} checked={checked ?? !!value} />;
}

/**
 * Form widget for boolean values that renders as a [Checkbox](https://ant.design/components/checkbox/).
 *
 * This is the [default widget](doc:getWidgetForField) used for [BooleanField](doc:BooleanField)
 *
 * <Usage type="widget" widgetName="BooleanWidget">
 * ```js
 * function BooleanWidgetExample() {
 * const [value, setValue] = useState(false);
 *  return <BooleanWidget input={{ onChange({ target: { checked } }) {
 *  setValue(checked)
 * }, value}} />
 * }
 * ```
 * </Usage>
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(BooleanWidget) as (props: BooleanWidgetProps) => React.ReactElement;
