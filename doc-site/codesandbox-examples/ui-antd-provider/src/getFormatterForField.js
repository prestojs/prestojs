import { getFormatterForField as defaultGetFormatterForField } from '@prestojs/ui';

export default function getFormatterForField(field) {
    // Add any app specific customisations here, eg
    // if (field instanceof BooleanField) {
    //    return CustomBooleanFormatter;
    // }
    // Otherwise fall back to specific UI library defaults
    let formatter;
    if ((formatter = defaultGetFormatterForField(field))) return formatter;
    // ... if integrating any other libraries add them here ...

    // Fall through to any parent UiProvider. If there is none or they
    // don't provide a formatter for this field then an error will be thrown
}
