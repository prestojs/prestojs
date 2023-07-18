import { WidgetProps } from '@prestojs/ui';
import React, { RefObject } from 'react';
import CheckboxChoicesWidget from './CheckboxChoicesWidget';
import RadioChoicesWidget from './RadioChoicesWidget';
import SelectAsyncChoicesWidget from './SelectAsyncChoicesWidget';
import SelectChoicesWidget from './SelectChoicesWidget';

type RawValue = string | number;

/**
 * @expandproperties Any additional props are passed through to the specify widget
 * @hideproperties meta
 * @typeParam ValueType {@inheritTypeParam ChoicesWidget}
 */
export type ChoicesWidgetProps<ValueType extends RawValue | RawValue[]> = WidgetProps<
    ValueType | null,
    HTMLElement,
    RawValue
> & {
    /**
     * The choices to render. This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
     */
    choices: ValueType extends Array<infer T>
        ? Map<T, string> | [T, string][]
        : Map<ValueType, string> | [ValueType, string][];
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
    /**
     * Ref to pass to underlying input element. Note that this isn't supported for
     * [RadioChoicesWidget](doc:RadioChoicesWidget) or [CheckboxChoicesWidget](doc:CheckboxChoicesWidget)
     */
    ref?: RefObject<any>;
    /**
     * Any other props to pass through to underlying widget
     */
    [x: string]: any;
};

type ChoicesWidgetPropsNoRef<ValueType extends RawValue | RawValue[]> = Omit<
    ChoicesWidgetProps<ValueType>,
    'ref'
>;

function ChoicesWidget<ValueType extends RawValue | RawValue[]>(
    props: ChoicesWidgetPropsNoRef<ValueType>,
    ref: any
): React.ReactElement {
    let { widgetType, asyncChoices, multiple, meta, ...rest } = props;
    if (multiple && widgetType === 'radio') {
        throw new Error("'widgetType=radio' is not valid when 'multiple=true'");
    }
    if (!widgetType) {
        widgetType =
            (rest.choices && Array.from(rest.choices).length > 3) || asyncChoices
                ? 'select'
                : multiple
                ? 'checkbox'
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
        return (
            <SelectAsyncChoicesWidget ref={ref} asyncChoices={asyncChoices} {...(rest as any)} />
        );
    }
    if (widgetType === 'select') {
        return (
            // @ts-ignore Not sure issue here, problem with `choices` but types are identical
            <SelectChoicesWidget ref={ref} {...rest} {...(multiple ? { mode: 'multiple' } : {})} />
        );
    } else if (widgetType === 'radio') {
        return <RadioChoicesWidget {...(rest as any)} />;
    } else if (widgetType === 'checkbox') {
        return <CheckboxChoicesWidget {...(rest as any)} />;
    }
    throw new Error(`Invalid widgetType="${widgetType}"`);
}

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
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 * @typeParam ValueType The type of the value, either `string` or `number`. If `multiple=true` this will be an array, otherwise it will be a single value.
 */
export default React.forwardRef(ChoicesWidget) as <ValueType extends RawValue | RawValue[]>(
    props: ChoicesWidgetProps<ValueType>
) => React.ReactElement;
