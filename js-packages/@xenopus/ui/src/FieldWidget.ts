import React from 'react';

// TODO: Based on final-form currently without much thought
export interface InputProps<FieldValue, T extends HTMLElement> {
    name: string;
    onBlur: (event?: React.FocusEvent<T>) => void;
    onChange: (event: React.ChangeEvent<T> | any) => void;
    onFocus: (event?: React.FocusEvent<T>) => void;
    type?: string;
    value: FieldValue;
    checked?: boolean;
    multiple?: boolean;
    choices?: Array<[FieldValue, string]>;
}

export interface WidgetProps<FieldValue, T extends HTMLElement> {
    input: InputProps<FieldValue, T>;
    meta?: {};
}

export interface RangedWidgetProps<FieldValue, T extends HTMLElement> {
    lowerInput: InputProps<FieldValue, T>;
    upperInput: InputProps<FieldValue, T>;
    separator: string;
    meta?: {};
}

type FieldWidget<FieldValue, T extends HTMLElement> =
    | React.ComponentType<WidgetProps<FieldValue, T>>
    | React.ComponentType<RangedWidgetProps<FieldValue, T>>
    | 'input'
    | 'select'
    | 'textarea';

export default FieldWidget;
