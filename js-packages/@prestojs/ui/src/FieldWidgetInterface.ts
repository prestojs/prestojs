import { AsyncChoicesInterface } from '@prestojs/viewmodel';
import React from 'react';

// TODO: Based on final-form currently without much thought
/**
 * The props that a widget can be expected to have access to. The only props
 * that must always be provided are `onChange`, and `value` once a value
 * has been set.
 *
 * When used with [@prestojs/final-form](/docs/final-form) this will be
 * the props described in the [final-form documentation](https://final-form.org/docs/react-final-form/types/FieldRenderProps).
 *
 * @expandproperties
 * @extractdocs
 * @typeParam FieldValueT The type of the value that the widget can accept
 * @typeParam ElementT The HTML element type (where applicable). This is the type
 * used in `FocusEvent` and `ChangeEvent`.
 */
export interface InputProps<FieldValueT, ElementT extends HTMLElement> {
    /**
     * Name of the field
     */
    name?: string;
    /**
     * The function to be called by the widget whenever the value changes
     *
     * This  can be passed either the value directly or an event that the value
     * can be extracted from (`event.target.value` or `event.target.checked`).
     */
    onChange: (event: React.ChangeEvent<ElementT> | any) => void;
    /**
     * The function to be called by the widget whenever a blur event occurs.
     *
     * Whether this function is supported depends on the widget.
     *
     * `event` may not be set if the field is blurred programmatically rather than
     * from user interaction.
     */
    onBlur?: (event?: React.FocusEvent<ElementT>) => void;
    /**
     * The function to be called by the widget whenever a focus event occurs.
     *
     * Whether this function is used depends on the widget.
     *
     * `event` may not be set if the field is focused programmatically rather than
     * from user interaction.
     */
    onFocus?: (event?: React.FocusEvent<ElementT>) => void;
    // type?: string;
    /**
     * The current value of the widget. After `onChange` is called this should
     * be the new value passed.
     */
    value?: FieldValueT;
    /**
     * For `checkbox` fields this may be set to indicate checked status. The usage of
     * this depends on the form library - @prestojs/final-form will set this when
     * `type="checkbox"` is passed to `Field`.
     */
    checked?: boolean;
    // multiple?: boolean;
}

/**
 * @expandproperties
 * @hideproperties meta choices asyncChoices
 */
export interface WidgetProps<FieldValue, T extends HTMLElement, SingleValue = FieldValue> {
    /**
     * The input props for the widget. This is typically passed by the form (eg. [Form](doc:Form) when
     * using [@prestojs/final-form](/docs/final-form)) but can be passed directly if used standalone.
     */
    input: InputProps<FieldValue, T>;
    /**
     * Any extra details such as field errors, touched status etc. The values here depend on the form
     * library in use. If using [@prestojs/final-form](/docs/final-form/) see [FieldRenderProps](https://final-form.org/docs/react-final-form/types/FieldRenderProps)
     * for what this will be.
     */
    meta?: Record<string, any>;
    /**
     * Any choices, if applicable. This typically comes from [Field.choices](doc:Field#var-choices).
     *
     * This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
     */
    choices?: Map<SingleValue, string> | [SingleValue, string][];
    /**
     * Any [AsyncChoices](doc:AsyncChoices), if applicable. This typically comes from [Field.asyncChoices](doc:Field#var-asyncChoices).
     */
    asyncChoices?: AsyncChoicesInterface<any, any>;
}

/**
 * @expandproperties
 */
export interface RangedWidgetProps<FieldValue, T extends HTMLElement, P> {
    /**
     * Any props you want to pass to the first ("lower") Input of a range. Props available depends on type of range widget being used.
     */
    lowerInput: P & { className?: string };
    /**
     * Any props you want to pass to the second ("upper") Input of a range. Props available depends on type of range widget being used.
     */
    upperInput: P & { className?: string };
    /**
     * the input coming from form; `value` and `onChange` of it is used by the RangedWidget.
     */
    input: InputProps<FieldValue, T> & {
        value?: { lower?: FieldValue; upper?: FieldValue; bound?: string };
    };
    /**
     * Separator between two Input elements; defaults to `-`.
     */
    separator: string;
    /**
     * Any extra details such as field errors, touched status etc. The values here depend on the form
     * library in use. If using [@prestojs/final-form](/docs/final-form/) see [FieldRenderProps](https://final-form.org/docs/react-final-form/types/FieldRenderProps)
     * for what this will be.
     */
    meta?: Record<string, any>;
    /**
     * className for the wrapper class.
     */
    className?: string;
}

export type FieldWidgetType<FieldValue, T extends HTMLElement> =
    | React.ComponentType<WidgetProps<FieldValue, T> | RangedWidgetProps<FieldValue, T, any>>
    | 'input'
    | 'select'
    | 'textarea';
