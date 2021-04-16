import { FieldWidgetType } from '@prestojs/ui';
import { Field } from '@prestojs/viewmodel';
import React from 'react';

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
    ['DecimalRangeField', React.lazy(() => import('./widgets/DecimalRangeWidget'))],
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
    ['ListField', React.lazy(() => import('./widgets/SelectChoiceWidget'))],
]);

/**
 * Returns the default widget to use for any given Field. This is the glue between the
 * [ViewModel](doc:viewModelFactory) fields and the specific antd UI form components to use.
 *
 * Depending on Field, this will return either a FieldWidget component directly, or an array like `[FieldWidget, props]` where props is the default props that would be applied to said widget.
 *
 * This should be passed to [UiProvider](doc:UiProvider) which will provide the function
 * to components like [FieldWidget](doc:FieldWidget).
 *
 * See [FieldWidget](doc:FieldWidget) for where this function typically gets called from.
 *
 * ### Simple usage:
 *
 * ```jsx
 * import { UiProvider, getFormatterForField } from '@prestojs/ui';
 * import {
 *   FormWrapper,
 *   getWidgetForField as antdGetWidgetForField,
 *   FormItemWrapper,
 * } from '@prestojs/ui-antd';
 *
 * function getWidgetForField(field) {
 *   const widget = antdGetWidgetForField(field);
 *   // If ui-antd doesn't provide a widget fall back to a default
 *   // You can add your own customisations here too (eg. override widgets
 *   // for specific fields or add support for new fields)
 *   if (!widget) {
 *     return DefaultWidget;
 *   }
 *   return widget;
 * }
 *
 * export default () => (
 *   <UiProvider
 *     getWidgetForField={getWidgetForField}
 *     getFormatterForField={getFormatterForField}
 *     formItemComponent={FormItemWrapper}
 *     formComponent={FormWrapper}
 *   >
 *     <YourApp />
 *   </UiProvider>
 * );
 * ```
 *
 * @param field The field to return the widget for.
 *
 * @menu-group Form
 * @extract-docs
 */
export default function getWidgetForField<
    FieldValue,
    ParsableValueT,
    SingleValueT,
    T extends HTMLElement
>(
    field: Field<FieldValue, ParsableValueT, SingleValueT>
):
    | FieldWidgetType<FieldValue, T>
    | [FieldWidgetType<FieldValue, T>, Record<string, unknown>]
    | null {
    const { fieldClassName } = Object.getPrototypeOf(field).constructor;
    // Couldn't work out what to type this as so field.constructor was accepted
    const getWidget = (clsName: string): FieldWidgetType<any, any> | null | undefined => {
        if (clsName === 'ListField') {
            if (field.choices) {
                return React.lazy(() => import('./widgets/SelectChoiceWidget'));
            } else {
                return React.lazy(() => import('./widgets/SelectAsyncChoiceWidget'));
            }
        } else if (field.choices || field.asyncChoices) {
            return choicesMapping.get(clsName) || mapping.get(clsName);
        }
        return mapping.get(clsName);
    };
    const widget = getWidget(fieldClassName);

    const getReturnWithChoices = (
        w,
        f
    ):
        | FieldWidgetType<FieldValue, T>
        | [FieldWidgetType<FieldValue, T>, Record<string, unknown>] => {
        if (f.choices || f.asyncChoices) {
            if (Array.isArray(w)) {
                return [w[0], { ...w[1], choices: f.choices, asyncChoices: f.asyncChoices }];
            } else {
                return [w, { choices: f.choices, asyncChoices: f.asyncChoices }];
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
        const widgetF = getWidget(f.fieldClassName);
        if (widgetF) {
            return getReturnWithChoices(widgetF, field);
        }
        f = Object.getPrototypeOf(f);
    } while (f.name);

    return null;
}
