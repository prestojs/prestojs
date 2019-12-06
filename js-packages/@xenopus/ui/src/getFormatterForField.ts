import {
    Field,
    BooleanField,
    CharField,
    CurrencyField,
    DateField,
    DateRangeField,
    DateTimeField,
    DateTimeRangeField,
    DecimalField,
    DurationField,
    EmailField,
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
} from '@xenopus/viewmodel';
import { Class } from '@xenopus/viewmodel';

import BooleanFormatter from './formatters/BooleanFormatter';
import CharFormatter from './formatters/CharFormatter';
import ChoiceFormatter from './formatters/ChoiceFormatter';
import DateFormatter from './formatters/DateFormatter';
import DateRangeFormatter from './formatters/DateRangeFormatter';
import DateTimeFormatter from './formatters/DateTimeFormatter';
import DateTimeRangeFormatter from './formatters/DateTimeRangeFormatter';
import ImageFormatter from './formatters/ImageFormatter';
import NumberFormatter from './formatters/NumberFormatter';
import NumberRangeFormatter from './formatters/NumberRangeFormatter';
import LinkFormatter from './formatters/LinkFormatter';
import TimeFormatter from './formatters/TimeFormatter';

const mapping = new Map<Class<Field<any>>, any>([
    [BooleanField, BooleanFormatter],
    [CharField, CharFormatter],
    [CurrencyField, NumberFormatter],
    [DateField, DateFormatter],
    [DateRangeField, DateRangeFormatter],
    [DateTimeField, DateTimeFormatter],
    [DateTimeRangeField, DateTimeRangeFormatter],
    [DecimalField, NumberFormatter],
    [DurationField, TimeFormatter],
    [EmailField, CharFormatter],
    [FileField, LinkFormatter],
    [FloatField, NumberFormatter],
    [FloatRangeField, NumberRangeFormatter],
    [ImageField, ImageFormatter],
    [IntegerField, NumberFormatter],
    [IntegerRangeField, NumberRangeFormatter],
    [IPAddressField, CharFormatter],
    [JsonField, CharFormatter],
    [NullableBooleanField, BooleanFormatter],
    [NumberField, NumberFormatter],
    [SlugField, CharFormatter],
    [TextField, CharFormatter],
    [TimeField, TimeFormatter],
    [URLField, LinkFormatter],
    [UUIDField, CharFormatter],
]);

// choices -> select/radio widgets; only accepting integer(for enum) and char for now
const choicesMapping = new Map<Class<Field<any>>, any>([
    [CharField, ChoiceFormatter],
    [IntegerField, ChoiceFormatter],
]);

export default function getFormatterForField<FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
): React.ComponentType<T> | string | null {
    const formatter: React.ComponentType<T> | null | undefined = field.choices
        ? choicesMapping.get(field.constructor as Class<Field<any>>) ||
          mapping.get(field.constructor as Class<Field<any>>)
        : mapping.get(field.constructor as Class<Field<any>>);

    if (formatter) {
        return formatter;
    }

    // If exact match not found check for any descendant classes
    for (const [fieldClass, component] of mapping) {
        if (field instanceof fieldClass) {
            return component;
        }
    }

    return null;
}
