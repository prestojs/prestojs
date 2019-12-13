import { FieldWidgetType } from '@prestojs/ui';
import {
    Field,
    BooleanField,
    CharField,
    DateField,
    DateRangeField,
    DateTimeField,
    DateTimeRangeField,
    DecimalField,
    DurationField,
    EmailField,
    CurrencyField,
    FileField,
    FloatField,
    FloatRangeField,
    ImageField,
    IntegerField,
    IntegerRangeField,
    IPAddressField,
    JsonField,
    NullableBooleanField,
    NumberField,
    SlugField,
    TextField,
    TimeField,
    URLField,
    UUIDField,
} from '@prestojs/viewmodel';
import { Class } from '@prestojs/viewmodel';

import BooleanWidget from './widgets/BooleanWidget';
import CharWidget from './widgets/CharWidget';
import CharChoicesWidget from './widgets/CharChoicesWidget';
import CurrencyWidget from './widgets/CurrencyWidget';
import DateWidget from './widgets/DateWidget';
import DateRangeWidget from './widgets/DateRangeWidget';
import DateTimeWidget from './widgets/DateTimeWidget';
import DateTimeRangeWidget from './widgets/DateTimeRangeWidget';
import DecimalWidget from './widgets/DecimalWidget';
import DurationWidget from './widgets/DurationWidget';
import EmailWidget from './widgets/EmailWidget';
import FileWidget from './widgets/FileWidget';
import FloatWidget from './widgets/FloatWidget';
import FloatRangeWidget from './widgets/FloatRangeWidget';
import ImageWidget from './widgets/ImageWidget';
import IntegerWidget from './widgets/IntegerWidget';
import IntegerChoicesWidget from './widgets/IntegerChoicesWidget';
import IntegerRangeWidget from './widgets/IntegerRangeWidget';
import IPAddressWidget from './widgets/IPAddressWidget';
import JsonWidget from './widgets/JsonWidget';
import NullableBooleanWidget from './widgets/NullableBooleanWidget';
import NumberWidget from './widgets/NumberWidget';
import SlugWidget from './widgets/SlugWidget';
import TextWidget from './widgets/TextWidget';
import TimeWidget from './widgets/TimeWidget';
import URLWidget from './widgets/URLWidget';
import UUIDWidget from './widgets/UUIDWidget';

// RangeField is not included: its not meant to be used directly - TODO: mark it abstract?
const mapping = new Map<Class<Field<any>>, FieldWidgetType<any, any>>([
    [BooleanField, BooleanWidget],
    [CharField, CharWidget],
    [CurrencyField, CurrencyWidget],
    [DateField, DateWidget],
    [DateRangeField, DateRangeWidget],
    [DateTimeField, DateTimeWidget],
    [DateTimeRangeField, DateTimeRangeWidget],
    [DecimalField, DecimalWidget],
    [DurationField, DurationWidget],
    [EmailField, EmailWidget],
    [FileField, FileWidget],
    [FloatField, FloatWidget],
    [FloatRangeField, FloatRangeWidget],
    [ImageField, ImageWidget],
    [IntegerField, IntegerWidget],
    [IntegerRangeField, IntegerRangeWidget],
    [IPAddressField, IPAddressWidget],
    [JsonField, JsonWidget],
    [NumberField, NumberWidget],
    [NullableBooleanField, NullableBooleanWidget],
    [SlugField, SlugWidget],
    [TextField, TextWidget],
    [TimeField, TimeWidget],
    [URLField, URLWidget],
    [UUIDField, UUIDWidget],
]);

// choices -> select/radio widgets; only accepting integer(for enum) and char for now - might want to expand to currency type of currency later.
const choicesMapping = new Map<Class<Field<any>>, FieldWidgetType<any, any>>([
    [CharField, CharChoicesWidget],
    [IntegerField, IntegerChoicesWidget],
]);

/*
 * Returns the default widget for any given Field.
 *
 * Depending on Field, this will return either a FieldWidget component directly, or [FieldWidget, props] where props is the default props that would be applied to said widget.
 */
export default function getWidgetForField<FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
): FieldWidgetType<FieldValue, T> | [FieldWidgetType<FieldValue, T>, object] | null {
    // Couldn't work out what to type this as so field.constructor was accepted
    const widget: FieldWidgetType<any, any> | null | undefined = field.choices
        ? choicesMapping.get(field.constructor as Class<Field<any>>) ||
          mapping.get(field.constructor as Class<Field<any>>)
        : mapping.get(field.constructor as Class<Field<any>>);

    const getReturnWithChoices = (
        w,
        f
    ): FieldWidgetType<FieldValue, T> | [FieldWidgetType<FieldValue, T>, object] => {
        if (f.choices) {
            if (Array.isArray(w)) {
                return [w[0], { ...w[1], choices: f.choices }];
            } else {
                return [w, { choices: f.choices }];
            }
        } else {
            return w;
        }
    };

    if (widget) {
        return getReturnWithChoices(widget, field);
    }

    // If exact match not found check for any descendant classes
    for (const [fieldClass, component] of mapping) {
        if (field instanceof fieldClass) {
            return getReturnWithChoices(component, field);
        }
    }

    return null;
}
