import React from 'react';
import {
    BooleanWidget,
    CharWidget,
    CurrencyWidget,
    DateWidget,
    DateRangeWidget,
    DateTimeWidget,
    DateTimeRangeWidget,
    DecimalWidget,
    DurationWidget,
    EmailWidget,
    FileWidget,
    FloatWidget,
    FloatRangeWidget,
    ImageWidget,
    IntegerWidget,
    IntegerRangeWidget,
    IPAddressWidget,
    JsonWidget,
    NumberWidget,
    NullableBooleanWidget,
    SlugWidget,
    TextWidget,
    TimeWidget,
    URLWidget,
    UUIDWidget,
    IntegerChoicesWidget,
    CharChoicesWidget,
} from '@prestojs/ui-antd';
import { Field } from '@prestojs/viewmodel';

const mapping = new Map([
    ['BooleanField', BooleanWidget],
    ['CharField', CharWidget],
    ['CurrencyField', CurrencyWidget],
    ['DateField', DateWidget],
    ['DateRangeField', DateRangeWidget],
    ['DateTimeField', DateTimeWidget],
    ['DateTimeRangeField', DateTimeRangeWidget],
    ['DecimalField', DecimalWidget],
    ['DurationField', DurationWidget],
    ['EmailField', EmailWidget],
    ['FileField', FileWidget],
    ['FloatField', FloatWidget],
    ['FloatRangeField', FloatRangeWidget],
    ['ImageField', ImageWidget],
    ['IntegerField', IntegerWidget],
    ['IntegerRangeField', IntegerRangeWidget],
    ['IPAddressField', IPAddressWidget],
    ['JsonField', JsonWidget],
    ['NumberField', NumberWidget],
    ['NullableBooleanField', NullableBooleanWidget],
    ['SlugField', SlugWidget],
    ['TextField', TextWidget],
    ['TimeField', TimeWidget],
    ['URLField', URLWidget],
    ['UUIDField', UUIDWidget],
]);

// choices -> select/radio widgets; only accepting integer(for enum) and char for now - might want to expand to currency type of currency later.
const choicesMapping = new Map([
    ['CharField', CharChoicesWidget],
    ['IntegerField', IntegerChoicesWidget],
]);

/*
 * Returns the default widget for any given Field.
 *
 * Depending on Field, this will return either a FieldWidget component directly, or [FieldWidget, props] where props is the default props that would be applied to said widget.
 */
export default function getWidgetForField(field) {
    // Couldn't work out what to type this as so field.constructor was accepted
    const widget = field.choices
        ? choicesMapping.get(field.constructor.name) || mapping.get(field.constructor.name)
        : mapping.get(field.constructor.name);

    const getReturnWithChoices = (w, f) => {
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

    // if no match can be found check prototypes
    let f = Object.getPrototypeOf(field.constructor);
    do {
        const widgetF = field.choices
            ? choicesMapping.get(f.name) || mapping.get(f.name)
            : mapping.get(f.name);
        if (widgetF) {
            return getReturnWithChoices(widgetF, field);
        }
        f = Object.getPrototypeOf(f);
    } while (f.name);

    return null;
}
