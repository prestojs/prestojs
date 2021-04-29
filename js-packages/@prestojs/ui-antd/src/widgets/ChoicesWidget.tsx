import { WidgetProps } from '@prestojs/ui';
import React from 'react';
import CheckboxChoicesWidget from './CheckboxChoicesWidget';
import RadioChoicesWidget from './RadioChoicesWidget';
import SelectAsyncChoicesWidget from './SelectAsyncChoicesWidget';
import SelectChoicesWidget from './SelectChoicesWidget';

type RawValue = string | number;

/**
 * @expand-properties Any additional props are passed through to the specify widget
 */
type ChoicesWidgetProps<ValueType extends RawValue | RawValue[]> = WidgetProps<
    ValueType,
    HTMLElement,
    RawValue
> & {
    /**
     * The choices to render. This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
     */
    choices: Map<ValueType, string> | [ValueType, string][];
    /**
     * Choices are rendered as either [SelectChoicesWidget](doc:SelectChoicesWidget),
     * [RadioChoicesWidget](doc:RadioChoicesWidget) (only if `multiple=false`) or
     * [CheckboxChoicesWidget](doc:CheckboxChoicesWidget) (only if `multiple=true)
     * Specify `select`, 'radio', or `checkbox` to choose one of these or leave blank to select based on number of choices (if > 3 defaults to
     * 'select' otherwise 'checkbox' or 'radio' depending on value of `multiple`).
     */
    widgetType?: 'select' | 'checkbox' | 'radio';
    /**
     * Whether multiple values are accepted
     */
    multiple?: boolean;
    [x: string]: any;
};

/**
 * Render a list of choices.
 *
 * The specific widget chosen is one of
 *
 * * [SelectAsyncChoicesWidget](SelectAsyncChoicesWidget) - when `asyncChoices` is provided. `widgetType` is ignored in this case.
 * * [SelectChoicesWidget](doc:SelectChoicesWidget) - when `widgetType="select"` or `widgetType` is not specified and there is more than 3 choices.
 * * [RadioChoicesWidget](doc:RadioChoicesWidget) - when `widgetType="radio"` or `multiple={false}` and `widgetType` is not specified and there is 3 or fewer choices.
 * * [CheckboxChoicesWidget](doc:CheckboxChoicesWidget) - when `widgetType="checkbox"` or `multiple={true}` and `widgetType` is not specified and there is 3 or fewer choices.
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function ChoicesWidget<ValueType extends RawValue | RawValue[]>(
    props: ChoicesWidgetProps<ValueType>,
    ref: any
): React.ReactElement {
    let { widgetType, asyncChoices, multiple, meta, ...rest } = props;
    if (multiple && widgetType === 'radio') {
        throw new Error("'widgetType=radio' is not valid when 'multiple=true'");
    }
    if (!widgetType) {
        widgetType =
            (rest.choices && Array.from(rest.choices).length > 3) || multiple || asyncChoices
                ? 'select'
                : 'radio';
    }
    if (widgetType !== 'select' && asyncChoices) {
        throw new Error(
            `When 'asyncChoices' is provided 'widgetType' must be 'select', received: ${widgetType}`
        );
    }
    if (asyncChoices) {
        if (multiple != null) {
            console.warn(
                `When 'asyncChoices' is specified 'multiple' does not need be specified - 'asyncChoices.multiple' is used instead.`
            );
        }
        if (multiple != null && asyncChoices.multiple !== multiple) {
            throw new Error(
                `When 'asyncChoices' is specified 'multiple' does not need be specified. Got mismatch - 'asyncChoices.multiple' = ${asyncChoices.multiple.toString()} but 'multiple' = ${multiple.toString()}`
            );
        }
        return <SelectAsyncChoicesWidget ref={ref} asyncChoices={asyncChoices} {...rest} />;
    }
    if (widgetType === 'select') {
        return (
            <SelectChoicesWidget ref={ref} {...rest} {...(multiple ? { mode: 'multiple' } : {})} />
        );
    } else if (widgetType === 'radio') {
        return <RadioChoicesWidget {...(rest as ChoicesWidgetProps<RawValue>)} />;
    } else if (widgetType === 'checkbox') {
        return <CheckboxChoicesWidget {...(rest as ChoicesWidgetProps<RawValue[]>)} />;
    }
    throw new Error(`Invalid widgetType="${widgetType}"`);
}

export default React.forwardRef(ChoicesWidget);
