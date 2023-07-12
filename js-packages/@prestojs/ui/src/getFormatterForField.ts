import { Field } from '@prestojs/viewmodel';
import React from 'react';
import type { FormatterComponentDefinition } from './UiProvider';

const LinkFormatter = React.lazy(() => import('./formatters/LinkFormatter'));
const RangeFormatter = React.lazy(() => import('./formatters/RangeFormatter'));
const ImageFormatter = React.lazy(() => import('./formatters/ImageFormatter'));

// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33006
// TLDR: currently @types/react disallows bare children (eg, string) to be returned from a functional component
// also see: issue 32832
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const BooleanFormatter = React.lazy(() => import('./formatters/BooleanFormatter'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const CharFormatter = React.lazy(() => import('./formatters/CharFormatter'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ChoiceFormatter = React.lazy(() => import('./formatters/ChoiceFormatter'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const DateFormatter = React.lazy(() => import('./formatters/DateFormatter'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const DateTimeFormatter = React.lazy(() => import('./formatters/DateTimeFormatter'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const NumberFormatter = React.lazy(() => import('./formatters/NumberFormatter'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const TimeFormatter = React.lazy(() => import('./formatters/TimeFormatter'));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const JsonFormatter = React.lazy(() => import('./formatters/JsonFormatter'));

const mapping = new Map<string, any>([
    ['BooleanField', BooleanFormatter],
    ['CharField', CharFormatter],
    ['DateField', DateFormatter],
    ['DateRangeField', [RangeFormatter, { baseFormatter: DateFormatter }]],
    ['DateTimeField', DateTimeFormatter],
    ['DateTimeRangeField', [RangeFormatter, { baseFormatter: DateTimeFormatter }]],
    ['DecimalField', NumberFormatter],
    ['EmailField', CharFormatter],
    ['FileField', LinkFormatter],
    ['FloatField', NumberFormatter],
    ['FloatRangeField', [RangeFormatter, { baseFormatter: NumberFormatter }]],
    ['ImageField', ImageFormatter],
    ['IntegerField', NumberFormatter],
    ['IntegerRangeField', [RangeFormatter, { baseFormatter: NumberFormatter }]],
    ['JsonField', JsonFormatter],
    ['NumberField', NumberFormatter],
    ['TextField', CharFormatter],
    ['TimeField', TimeFormatter],
    ['URLField', LinkFormatter],
]);

// choices -> select/radio widgets; only accepting integer(for enum) and char for now
const choicesMapping = new Map<string, any>([
    ['CharField', ChoiceFormatter],
    ['IntegerField', ChoiceFormatter],
]);

/**
 * Returns the default formatter for a given [Field](doc:Field).
 *
 * This can be called directly but is more commonly used via [UiProvider](doc:UiProvider) and [FieldFormatter](doc:FieldFormatter).
 *
 * Depending on Field, this will return either a Formatter component directly, or [Formatter, props] where props is the default props that would be applied to said formatter.
 *
 * > **NOTE**
 * > The formatter components here are loaded using [React.lazy](https://reactjs.org/docs/code-splitting.html). Your build must support
 * > this otherwise it is recommended to implement your own version (you can copy [this implementation](https://github.com/prestojs/prestojs/blob/master/js-packages/@prestojs/ui/src/getFormatterForField.ts)
 * > as a starting point).
 *
 * @param field The field to get the formatter for
 *
 * @extractdocs
 */
export default function getFormatterForField<FieldValue, ParsableValueT, SingleValueT>(
    field: Field<FieldValue, ParsableValueT, SingleValueT>
): FormatterComponentDefinition<FieldValue> | null {
    const { fieldClassName } = Object.getPrototypeOf(field).constructor;
    const formatter: React.FunctionComponent | string | null | undefined = field.choices
        ? choicesMapping.get(fieldClassName) || mapping.get(fieldClassName)
        : mapping.get(fieldClassName);

    const getReturnWithChoices = (
        w: FormatterComponentDefinition<FieldValue>,
        f: Field<FieldValue, ParsableValueT, SingleValueT>
    ): FormatterComponentDefinition<FieldValue> => {
        if (f.choices) {
            if (Array.isArray(w)) {
                return [w[0], { ...f.getFormatterProps(), ...w[1], choices: f.choices }];
            } else {
                return [w, { choices: f.choices, ...f.getFormatterProps() }];
            }
        } else {
            if (Array.isArray(w)) {
                return [w[0], { ...f.getFormatterProps(), ...w[1] }];
            }
            return [w, f.getFormatterProps()];
        }
    };

    if (formatter) {
        return getReturnWithChoices(formatter, field);
    }

    let f = Object.getPrototypeOf(field.constructor);
    do {
        const formatterF: React.FunctionComponent | string | null | undefined = field.choices
            ? choicesMapping.get(f.fieldClassName) || mapping.get(f.fieldClassName)
            : mapping.get(f.fieldClassName);
        if (formatterF) {
            return getReturnWithChoices(formatterF, field);
        }
        f = Object.getPrototypeOf(f);
    } while (f.name);

    return null;
}
