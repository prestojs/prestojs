import { AsyncChoicesInterface } from '@prestojs/viewmodel';
import React from 'react';

// TODO: Based on final-form currently without much thought
/**
 * @expand-properties
 */
export interface InputProps<FieldValue, T extends HTMLElement> {
    /**
     * Name of the field
     */
    name: string;
    onBlur: (event?: React.FocusEvent<T>) => void;
    onChange: (event: React.ChangeEvent<T> | any) => void;
    onFocus: (event?: React.FocusEvent<T>) => void;
    type?: string;
    value?: FieldValue;
    checked?: boolean;
    multiple?: boolean;
}

/**
 * @expand-properties
 */
export interface WidgetProps<FieldValue, T extends HTMLElement> {
    /**
     * The input props for the widget. This should include, at minimum:
     *
     * - name
     * - onChange
     * - value
     *
     * Can also include
     *
     * - onBlur
     * - onFocus
     * - type
     * - checked
     * - multiple
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
     */
    choices?: Map<FieldValue, string>;
    /**
     * Any [AsyncChoices](doc:AsyncChoices), if applicable. This typically comes from [Field.asyncChoices](doc:Field#var-asyncChoices).
     */
    asyncChoices?: AsyncChoicesInterface<any, any>;
}

export interface RangedWidgetProps<FieldValue, T extends HTMLElement, P> {
    lowerInput: P;
    upperInput: P;
    separator: string;
    /**
     * Any extra details such as field errors, touched status etc. The values here depend on the form
     * library in use. If using [@prestojs/final-form](/docs/final-form/) see [FieldRenderProps](https://final-form.org/docs/react-final-form/types/FieldRenderProps)
     * for what this will be.
     */
    meta?: Record<string, any>;
}

export type FieldWidgetType<FieldValue, T extends HTMLElement> =
    | React.ComponentType<WidgetProps<FieldValue, T> | RangedWidgetProps<FieldValue, T, any>>
    | 'input'
    | 'select'
    | 'textarea';
