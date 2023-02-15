import { FieldWidgetType } from '@prestojs/ui';
import type { ListField } from '@prestojs/viewmodel';
import { Field } from '@prestojs/viewmodel';
import React from 'react';

// RangeField is not included: its not meant to be used directly - TODO: mark it abstract?
const mapping = new Map<string, FieldWidgetType<any, any>>([
    ['CharField', React.lazy(() => import('./widgets/CharWidget'))],
    ['DateField', React.lazy(() => import('./widgets/DateWidget'))],
    ['DateRangeField', React.lazy(() => import('./widgets/DateRangeWidget'))],
    ['DateTimeField', React.lazy(() => import('./widgets/DateTimeWidget'))],
    ['DateTimeRangeField', React.lazy(() => import('./widgets/DateTimeRangeWidget'))],
    ['DecimalField', React.lazy(() => import('./widgets/DecimalWidget'))],
    ['DecimalRangeField', React.lazy(() => import('./widgets/DecimalRangeWidget'))],
    ['EmailField', React.lazy(() => import('./widgets/EmailWidget'))],
    ['FileField', React.lazy(() => import('./widgets/FileWidget'))],
    ['FloatField', React.lazy(() => import('./widgets/FloatWidget'))],
    ['FloatRangeField', React.lazy(() => import('./widgets/FloatRangeWidget'))],
    ['ImageField', React.lazy(() => import('./widgets/ImageWidget'))],
    ['IntegerField', React.lazy(() => import('./widgets/IntegerWidget'))],
    ['IntegerRangeField', React.lazy(() => import('./widgets/IntegerRangeWidget'))],
    ['JsonField', React.lazy(() => import('./widgets/JsonWidget'))],
    ['NumberField', React.lazy(() => import('./widgets/NumberWidget'))],
    ['PasswordField', React.lazy(() => import('./widgets/PasswordWidget'))],
    ['TextField', React.lazy(() => import('./widgets/TextWidget'))],
    ['TimeField', React.lazy(() => import('./widgets/TimeWidget'))],
    ['URLField', React.lazy(() => import('./widgets/CharWidget'))],
]);

// choices -> select/radio widgets; only accepting integer(for enum) and char for now - might want to expand to currency type of currency later.
const choicesMapping = new Map<string, FieldWidgetType<any, any>>([
    ['CharField', React.lazy(() => import('./widgets/CharChoicesWidget'))],
    ['IntegerField', React.lazy(() => import('./widgets/IntegerChoicesWidget'))],
]);

const LazyBooleanWidget = React.lazy(() => import('./widgets/NullableBooleanWidget'));
const BooleanWidget = React.lazy(() => import('./widgets/BooleanWidget'));

function splitWidgetAndProps(
    maybeWidgetAndProps:
        | null
        | undefined
        | FieldWidgetType<any, any>
        | [FieldWidgetType<any, any>, Record<string, unknown>]
): [FieldWidgetType<any, any> | null, Record<string, unknown>] {
    if (!maybeWidgetAndProps) {
        return [null, {}];
    }
    if (Array.isArray(maybeWidgetAndProps)) {
        return maybeWidgetAndProps;
    }
    return [maybeWidgetAndProps, {}];
}

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
 * > **NOTE**
 * > The widget components here are loaded using [React.lazy](https://reactjs.org/docs/code-splitting.html). Your build must support
 * > this otherwise it is recommended to implement your own version (you can copy [this implementation](https://github.com/prestojs/prestojs/blob/master/js-packages/@prestojs/ui-antd/src/getWidgetForField.ts)
 * > as a starting point).
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
    // Couldn't work out what to type this as so field.constructor was accepted
    const getWidget = (
        _field: Field<FieldValue, ParsableValueT, SingleValueT>
    ):
        | FieldWidgetType<any, any>
        | null
        | undefined
        | [FieldWidgetType<any, any>, Record<string, unknown>] => {
        const { fieldClassName } = Object.getPrototypeOf(_field).constructor;
        let widget:
            | undefined
            | FieldWidgetType<any, any>
            | [FieldWidgetType<any, any>, Record<string, unknown>];
        if (fieldClassName === 'ListField' && !(_field.choices || _field.asyncChoices)) {
            throw new Error(
                `${_field} is a ListField without either choices or asyncChoices. This is not yet supported.`
            );
        }
        if (_field.choices || _field.asyncChoices) {
            widget = choicesMapping.get(fieldClassName) || mapping.get(fieldClassName);
        } else {
            widget = mapping.get(fieldClassName);
        }
        if (fieldClassName === 'ListField' && !widget) {
            const [_widget, props] = splitWidgetAndProps(
                getWidget((_field as unknown as ListField<any, any>).childField)
            );
            if (_widget) {
                return [_widget, { ...props, multiple: true }];
            }
        }
        if (fieldClassName === 'BooleanField' && !widget) {
            if (_field.blank) {
                return LazyBooleanWidget;
            }
            return BooleanWidget;
        }
        return widget;
    };
    const [widget, extraProps] = splitWidgetAndProps(getWidget(field));

    const getReturnWithChoices = (
        _widget: FieldWidgetType<FieldValue, T>,
        _field: Field<FieldValue, ParsableValueT, SingleValueT>,
        extraProps: Record<string, unknown>
    ):
        | FieldWidgetType<FieldValue, T>
        | [FieldWidgetType<FieldValue, T>, Record<string, unknown>] => {
        if (_field.choices || _field.asyncChoices) {
            const finalWidget = Array.isArray(_widget) ? _widget[0] : _widget;
            const props = Array.isArray(_widget) ? _widget[1] : {};
            const finalProps = {
                ..._field.getWidgetProps(),
                ...props,
                ...extraProps,
            };
            // Only set this when necessary to avoid passing props through
            // with undefined value that may make it's way through to the DOM
            if (_field.choices) {
                finalProps.choices = _field.choices;
            }
            if (_field.asyncChoices) {
                finalProps.asyncChoices = _field.asyncChoices;
            }

            return [finalWidget, finalProps];
        } else {
            if (widget) {
                return [_widget, _field.getWidgetProps()];
            }
            return _widget;
        }
    };

    if (widget) {
        return getReturnWithChoices(widget, field, extraProps);
    }

    // if no match can be found check prototypes
    let f = Object.getPrototypeOf(field.constructor);
    do {
        const [widgetF, props] = splitWidgetAndProps(getWidget(f));
        if (widgetF) {
            return getReturnWithChoices(widgetF, field, props);
        }
        f = Object.getPrototypeOf(f);
    } while (f.name);

    return null;
}
