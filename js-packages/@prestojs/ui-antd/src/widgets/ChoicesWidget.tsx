import { WidgetProps } from '@prestojs/ui';
import React from 'react';
import CheckboxChoiceWidget from './CheckboxChoiceWidget';
import RadioChoiceWidget from './RadioChoiceWidget';
import SelectAsyncChoiceWidget from './SelectAsyncChoiceWidget';
import SelectChoiceWidget from './SelectChoiceWidget';

/**
 * @expand-properties
 */
type ChoicesWidgetSingleProps<ValueType extends string | number> = WidgetProps<
    ValueType,
    HTMLElement
> & {
    /**
     * Choices are rendered as either [SelectChoiceWidget](doc:SelectChoiceWidget) or [RadioChoiceWidget](doc:RadioChoiceWidget).
     * Specify `select` or `radio` to choose one of these or leave blank to select based on number of choices (if > 3 defaults to
     * 'select' otherwise 'radio').
     */
    widgetType?: 'select' | 'radio';
    /**
     * Multiple values are accepted. `widgetType` must be `select`, `radio` or unspecified.
     */
    multiple?: false;
};

/**
 * @expand-properties
 */
type ChoicesWidgetMultipleProps<ValueType extends (string | number)[]> = WidgetProps<
    ValueType,
    HTMLElement,
    number | string
> & {
    /**
     * Choices are rendered as either [SelectChoiceWidget](doc:SelectChoiceWidget) or [CheckboxChoiceWidget](doc:CheckboxChoiceWidget).
     * Specify `select` or `checkbox` to choose one of these or leave blank to select based on number of choices (if > 3 defaults to
     * 'select' otherwise 'checkbox').
     */
    widgetType?: 'select' | 'checkbox';
    /**
     * Multiple values are accepted. `widgetType` must be `select`, `checkbox` or unspecified.
     */
    multiple: true;
};

/**
 * Render a list of choices.
 *
 * The specific widget chosen is one of
 *
 * * [SelectAsyncChoiceWidget](SelectAsyncChoiceWidget) - when `asyncChoices` is provided. `widgetType` is ignored in this case.
 * * [SelectChoiceWidget](doc:SelectChoiceWidget) - when `widgetType="select"` or `widgetType` is not specified and there is more than 3 choices.
 * * [RadioChoiceWidget](doc:RadioChoiceWidget) - when `widgetType="radio"` or `multiple={false}` and `widgetType` is not specified and there is 3 or fewer choices.
 * * [CheckboxChoiceWidget](doc:CheckboxChoiceWidget) - when `widgetType="checkbox"` or `multiple={true}` and `widgetType` is not specified and there is 3 or fewer choices.
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function ChoicesWidget<ValueType extends number | string>(
    props: ChoicesWidgetSingleProps<ValueType>,
    ref: any
): React.ReactElement;
function ChoicesWidget<ValueType extends (number | string)[]>(
    props: ChoicesWidgetMultipleProps<ValueType>,
    ref: any
): React.ReactElement;
function ChoicesWidget(
    props: ChoicesWidgetMultipleProps<any> | ChoicesWidgetSingleProps<any>,
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
        if (multiple != null && asyncChoices.multiple !== multiple) {
            throw new Error(
                `When 'asyncChoices' is specified 'multiple' does not need be specified. Got mismatch - 'asyncChoices.multiple' = ${asyncChoices.multiple.toString()} but 'multiple' = ${multiple.toString()}`
            );
        }
        return <SelectAsyncChoiceWidget ref={ref} asyncChoices={asyncChoices} {...rest} />;
    }
    if (widgetType === 'select') {
        return (
            <SelectChoiceWidget ref={ref} {...rest} {...(multiple ? { mode: 'multiple' } : {})} />
        );
    } else if (widgetType === 'radio') {
        return <RadioChoiceWidget {...rest} />;
    } else if (widgetType === 'checkbox') {
        return <CheckboxChoiceWidget {...rest} />;
    }
    throw new Error(`Invalid widgetType="${widgetType}"`);
}

export default React.forwardRef(ChoicesWidget);
