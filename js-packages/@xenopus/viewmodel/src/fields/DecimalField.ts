import Field from './Field';

/**
 * We dont want to include 3rd party libs - hence no decimal.js; in which case we'll leave this as string.
 *
 * Also used by CurrencyField.
 *
 */
export default class DecimalField<T> extends Field<string> {}
