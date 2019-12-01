import { FieldWidget } from '@xenopus/ui';
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
    IntegerField,
    IntegerRangeField,
    UUIDField,
    ImageField,
    URLField,
    SlugField,
    TextField,
    IPAddressField,
    JsonField,
    TimeField,
} from '@xenopus/viewmodel';
import { Class } from '@xenopus/viewmodel';

import BooleanWidget from './widgets/BooleanWidget';
import CharWidget from './widgets/CharWidget';
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
import IntegerRangeWidget from './widgets/IntegerRangeWidget';
import IPAddressWidget from './widgets/IPAddressWidget';
import JsonWidget from './widgets/JsonWidget';
//import NumberWidget from './widgets/NumberWidget';
import SlugWidget from './widgets/SlugWidget';
import TextWidget from './widgets/TextWidget';
import TimeWidget from './widgets/TimeWidget';
import URLWidget from './widgets/URLWidget';
import UUIDWidget from './widgets/UUIDWidget';

// RangeField is not included: its not meant to be used directly - TODO: mark it abstract?
// TODO: number field's probably an abstract now as well - confirm w/ dave
// TODO - all these are specific widgets. we might? want to provide some generic widgets wrapped around antd as well?
const mapping = new Map<Class<Field<any>>, FieldWidget<any, any>>([
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
    [SlugField, SlugWidget],
    [TextField, TextWidget],
    [TimeField, TimeWidget],
    [URLField, URLWidget],
    [UUIDField, UUIDWidget],
]);

export default function getWidgetForField<FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
): FieldWidget<FieldValue, T> | null {
    // Couldn't work out what to type this as so field.constructor was accepted
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const widget: FieldWidget | null = mapping.get(field.constructor);
    if (widget) {
        return widget;
    }
    // If exact match not found check for any descendant classes
    for (const [fieldClass, component] of mapping) {
        if (field instanceof fieldClass) {
            return component;
        }
    }

    return null;
}
