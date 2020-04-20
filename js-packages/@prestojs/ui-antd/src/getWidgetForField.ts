import React from 'react';
import { FieldWidgetType } from '@prestojs/ui/FieldWidgetInterface';
import { Field } from '@prestojs/viewmodel';

// RangeField is not included: its not meant to be used directly - TODO: mark it abstract?
const mapping = new Map<string, FieldWidgetType<any, any>>([
    ['BooleanField', React.lazy(() => import('./widgets/BooleanWidget'))],
    ['CharField', React.lazy(() => import('./widgets/CharWidget'))],
    ['CurrencyField', React.lazy(() => import('./widgets/CurrencyWidget'))],
    ['DateField', React.lazy(() => import('./widgets/DateWidget'))],
    ['DateRangeField', React.lazy(() => import('./widgets/DateRangeWidget'))],
    ['DateTimeField', React.lazy(() => import('./widgets/DateTimeWidget'))],
    ['DateTimeRangeField', React.lazy(() => import('./widgets/DateTimeRangeWidget'))],
    ['DecimalField', React.lazy(() => import('./widgets/DecimalWidget'))],
    ['DurationField', React.lazy(() => import('./widgets/DurationWidget'))],
    ['EmailField', React.lazy(() => import('./widgets/EmailWidget'))],
    ['FileField', React.lazy(() => import('./widgets/FileWidget'))],
    ['FloatField', React.lazy(() => import('./widgets/FloatWidget'))],
    ['FloatRangeField', React.lazy(() => import('./widgets/FloatRangeWidget'))],
    ['ImageField', React.lazy(() => import('./widgets/ImageWidget'))],
    ['IntegerField', React.lazy(() => import('./widgets/IntegerWidget'))],
    ['IntegerRangeField', React.lazy(() => import('./widgets/IntegerRangeWidget'))],
    ['IPAddressField', React.lazy(() => import('./widgets/IPAddressWidget'))],
    ['JsonField', React.lazy(() => import('./widgets/JsonWidget'))],
    ['NumberField', React.lazy(() => import('./widgets/NumberWidget'))],
    ['NullableBooleanField', React.lazy(() => import('./widgets/NullableBooleanWidget'))],
    ['SlugField', React.lazy(() => import('./widgets/SlugWidget'))],
    ['TextField', React.lazy(() => import('./widgets/TextWidget'))],
    ['TimeField', React.lazy(() => import('./widgets/TimeWidget'))],
    ['URLField', React.lazy(() => import('./widgets/URLWidget'))],
    ['UUIDField', React.lazy(() => import('./widgets/UUIDWidget'))],
]);

// choices -> select/radio widgets; only accepting integer(for enum) and char for now - might want to expand to currency type of currency later.
const choicesMapping = new Map<string, FieldWidgetType<any, any>>([
    ['CharField', React.lazy(() => import('./widgets/CharChoicesWidget'))],
    ['IntegerField', React.lazy(() => import('./widgets/IntegerChoicesWidget'))],
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
        ? choicesMapping.get(field.constructor.name) || mapping.get(field.constructor.name)
        : mapping.get(field.constructor.name);

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

    // if no match can be found check prototypes
    let f = Object.getPrototypeOf(field.constructor);
    do {
        const widgetF: FieldWidgetType<any, any> | null | undefined = field.choices
            ? choicesMapping.get(f.name) || mapping.get(f.name)
            : mapping.get(f.name);
        if (widgetF) {
            return getReturnWithChoices(widgetF, field);
        }
        f = Object.getPrototypeOf(f);
    } while (f.name);

    return null;
}
