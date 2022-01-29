import dynamic from 'next/dynamic';

const LinkFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.LinkFormatter));
const RangeFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.RangeFormatter));
const ImageFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.ImageFormatter));

const BooleanFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.BooleanFormatter));
const CharFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.CharFormatter));
const ChoiceFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.ChoiceFormatter));
const DateFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.DateFormatter));
const DateTimeFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.DateTimeFormatter));
const NumberFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.NumberFormatter));
const TimeFormatter = dynamic(() => import('@prestojs/ui').then(mod => mod.TimeFormatter));

const mapping = new Map([
    ['BooleanField', BooleanFormatter],
    ['CharField', CharFormatter],
    ['CurrencyField', NumberFormatter],
    ['DateField', DateFormatter],
    ['DateRangeField', [RangeFormatter, { baseFormatter: DateFormatter }]],
    ['DateTimeField', DateTimeFormatter],
    ['DateTimeRangeField', [RangeFormatter, { baseFormatter: DateTimeFormatter }]],
    ['DecimalField', NumberFormatter],
    ['DurationField', TimeFormatter],
    ['EmailField', CharFormatter],
    ['FileField', LinkFormatter],
    ['FloatField', NumberFormatter],
    ['FloatRangeField', [RangeFormatter, { baseFormatter: NumberFormatter }]],
    ['ImageField', ImageFormatter],
    ['IntegerField', NumberFormatter],
    ['IntegerRangeField', [RangeFormatter, { baseFormatter: NumberFormatter }]],
    ['IPAddressField', CharFormatter],
    ['JsonField', CharFormatter],
    ['NullableBooleanField', BooleanFormatter],
    ['NumberField', NumberFormatter],
    ['SlugField', CharFormatter],
    ['TextField', CharFormatter],
    ['TimeField', TimeFormatter],
    ['URLField', LinkFormatter],
    ['UUIDField', CharFormatter],
]);

// choices -> select/radio widgets; only accepting integer(for enum) and char for now
const choicesMapping = new Map([
    ['CharField', ChoiceFormatter],
    ['IntegerField', ChoiceFormatter],
]);

/*
 * Returns the default formatter for any given Field.
 *
 * Depending on Field, this will return either a Formatter component directly, or [Formatter, props] where props is the default props that would be applied to said formatter.
 *
 * @extract-docs
 */
export default function getFormatterForField(field) {
    const { fieldClassName } = Object.getPrototypeOf(field).constructor;
    const formatter = field.choices
        ? choicesMapping.get(fieldClassName) || mapping.get(fieldClassName)
        : mapping.get(fieldClassName);
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
    if (formatter) {
        return getReturnWithChoices(formatter, field);
    }

    let f = Object.getPrototypeOf(field.constructor);
    do {
        const formatterF = field.choices
            ? choicesMapping.get(f.fieldClassName) || mapping.get(f.fieldClassName)
            : mapping.get(f.fieldClassName);
        if (formatterF) {
            return getReturnWithChoices(formatterF, field);
        }
        f = Object.getPrototypeOf(f);
    } while (f.name);

    return null;
}
