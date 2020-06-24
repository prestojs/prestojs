import { AsyncChoicesInterface } from '@prestojs/viewmodel';
import React from 'react';

// TODO: Based on final-form currently without much thought
export interface InputProps<FieldValue, T extends HTMLElement> {
    name: string;
    onBlur: (event?: React.FocusEvent<T>) => void;
    onChange: (event: React.ChangeEvent<T> | any) => void;
    onFocus: (event?: React.FocusEvent<T>) => void;
    type?: string;
    value?: FieldValue;
    checked?: boolean;
    multiple?: boolean;
}

export interface WidgetProps<FieldValue, T extends HTMLElement> {
    input: InputProps<FieldValue, T>;
    meta?: {};
    choices?: Map<FieldValue, string>;
    asyncChoices?: AsyncChoicesInterface<any, any, any>;
}

export interface RangedWidgetProps<FieldValue, T extends HTMLElement, P> {
    lowerInput: P;
    upperInput: P;
    separator: string;
    meta?: {};
}

export type FieldWidgetType<FieldValue, T extends HTMLElement> =
    | React.ComponentType<WidgetProps<FieldValue, T> | RangedWidgetProps<FieldValue, T, any>>
    | 'input'
    | 'select'
    | 'textarea';
