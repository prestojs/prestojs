import dynamic from 'next/dynamic';

const mapping = new Map<string, any>([
    // @ts-ignore
    ['BooleanField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.BooleanWidget))],
    [
        'CharField',
        // @ts-ignore
        dynamic(() => import('@prestojs/ui-antd/widgets/CharWidget').then(mod => mod.default)),
    ],
    // @ts-ignore
    ['CurrencyField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.CurrencyWidget))],
    // @ts-ignore
    ['DateField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.DateWidget))],
    // @ts-ignore
    ['DateRangeField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.DateRangeWidget))],
    // @ts-ignore
    ['DateTimeField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.DateTimeWidget))],
    [
        'DateTimeRangeField',
        // @ts-ignore
        dynamic(() => import('@prestojs/ui-antd').then(mod => mod.DateTimeRangeWidget)),
    ],
    // @ts-ignore
    ['DecimalField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.DecimalWidget))],
    // @ts-ignore
    ['DurationField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.DurationWidget))],
    // @ts-ignore
    ['EmailField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.EmailWidget))],
    // @ts-ignore
    ['FileField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.FileWidget))],
    // @ts-ignore
    ['FloatField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.FloatWidget))],
    [
        'FloatRangeField',
        // @ts-ignore
        dynamic(() => import('@prestojs/ui-antd').then(mod => mod.FloatRangeWidget)),
    ],
    ['ImageField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.ImageWidget))],
    // @ts-ignore
    ['IntegerField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.IntegerWidget))],
    [
        'IntegerRangeField',
        // @ts-ignore
        dynamic(() => import('@prestojs/ui-antd').then(mod => mod.IntegerRangeWidget)),
    ],
    // @ts-ignore
    ['IPAddressField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.IPAddressWidget))],
    // @ts-ignore
    ['JsonField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.JsonWidget))],
    // @ts-ignore
    ['NumberField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.NumberWidget))],
    [
        'NullableBooleanField',
        dynamic(() => import('@prestojs/ui-antd').then(mod => mod.NullableBooleanWidget)),
    ],
    // @ts-ignore
    ['SlugField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.SlugWidget))],
    // @ts-ignore
    ['TextField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.TextWidget))],
    // @ts-ignore
    ['TimeField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.TimeWidget))],
    // @ts-ignore
    ['URLField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.URLWidget))],
    // @ts-ignore
    ['UUIDField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.UUIDWidget))],
]);

// choices -> select/radio widgets; only accepting integer(for enum) and char for now - might want to expand to currency type of currency later.
const choicesMapping = new Map([
    ['CharField', dynamic(() => import('@prestojs/ui-antd').then(mod => mod.CharChoicesWidget))],
    [
        'IntegerField',
        dynamic(() => import('@prestojs/ui-antd').then(mod => mod.IntegerChoicesWidget)),
    ],
]);

/*
 * Returns the default widget for any given Field.
 *
 * Depending on Field, this will return either a FieldWidget component directly, or [FieldWidget, props] where props is the default props that would be applied to said widget.
 */
export default function getWidgetForField(field) {
    // Couldn't work out what to type this as so field.constructor was accepted
    const widget = field.choices
        ? choicesMapping.get(field.constructor.fieldClassName) ||
          mapping.get(field.constructor.fieldClassName)
        : mapping.get(field.constructor.fieldClassName);

    const getReturnWithChoices = (w, f) => {
        if (f.choices) {
            if (Array.isArray(w)) {
                return [w[0], { ...w[1], choices: f.choices }];
            } else {
                return [w, { choices: f.choices }];
            }
        } else {
            if (f.maxLength) {
                return [w, { maxLength: f.maxLength }];
            }
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
            ? choicesMapping.get(f.fieldClassName) || mapping.get(f.fieldClassName)
            : mapping.get(f.fieldClassName);
        if (widgetF) {
            return getReturnWithChoices(widgetF, field);
        }
        f = Object.getPrototypeOf(f);
    } while (f.name);

    return null;
}
