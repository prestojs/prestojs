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
} from '@prestojs/viewmodel';
import { Class } from '@prestojs/viewmodel';

import BooleanFormatter from './formatters/BooleanFormatter';
import CharFormatter from './formatters/CharFormatter';
import ChoiceFormatter from './formatters/ChoiceFormatter';
import DateFormatter from './formatters/DateFormatter';
import DateTimeFormatter from './formatters/DateTimeFormatter';
import ImageFormatter from './formatters/ImageFormatter';
import NumberFormatter from './formatters/NumberFormatter';
import LinkFormatter from './formatters/LinkFormatter';
import RangeFormatter from './formatters/RangeFormatter';
import TimeFormatter from './formatters/TimeFormatter';

const mapping = new Map<Class<Field<any>>, any>([
    [BooleanField, BooleanFormatter],
    [CharField, CharFormatter],
    [CurrencyField, NumberFormatter],
    [DateField, DateFormatter],
    [DateRangeField, [RangeFormatter, { baseFormatter: DateFormatter }]],
    [DateTimeField, DateTimeFormatter],
    [DateTimeRangeField, [RangeFormatter, { baseFormatter: DateTimeFormatter }]],
    [DecimalField, NumberFormatter],
    [DurationField, TimeFormatter],
    [EmailField, CharFormatter],
    [FileField, LinkFormatter],
    [FloatField, NumberFormatter],
    [FloatRangeField, [RangeFormatter, { baseFormatter: NumberFormatter }]],
    [ImageField, ImageFormatter],
    [IntegerField, NumberFormatter],
    [IntegerRangeField, [RangeFormatter, { baseFormatter: NumberFormatter }]],
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

/*
 * Returns the default formatter for any given Field.
 *
 * Depending on Field, this will return either a Formatter component directly, or [Formatter, props] where props is the default props that would be applied to said formatter.
 *
 * @extract-docs
 */
export default function getFormatterForField<FieldValue, T extends HTMLElement>(
    field: Field<FieldValue>
): React.ComponentType<T> | [React.ComponentType<T>, object] | null {
    const formatter: React.FunctionComponent | null | undefined = field.choices
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
