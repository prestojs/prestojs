import { FieldWidget } from '@xenopus/ui';
import { Field, NumberField } from '@xenopus/viewmodel';
import { Class } from '@xenopus/viewmodel';

import NumberWidget from './widgets/NumberWidget';

const mapping = new Map<Class<Field<any>>, FieldWidget>([[NumberField, NumberWidget]]);

export default function getWidgetForField<T>(field: Field<T>): FieldWidget | null {
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
